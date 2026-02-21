import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";
import {
  benchmarkSeries,
  getCh10BenchmarkProfile,
} from "@/labs/_benchmarks/ch10";
import {
  createMulberry32,
  createSensorState,
  seriesRmsResidual,
  updateSensor,
  type SensorState,
} from "@/labs/v1-ch10-shared/measurement";
import { integrateBody, resolveWallContact, type Body1D } from "@/labs/v1-ch10-shared/physics";

type Params = {
  mass2: number;
  stretch: number;
  springDamping: number;
  sensorHz: number;
  sensorSmoothing: number;
  sensorNoise: number;
  sensorOffset: number;
};

type HistoryPoint = {
  t: number;
  trueF12: number;
  trueF21: number;
  measuredF12: number;
  measuredF21: number;
  measuredBalance: number;
};

type State = {
  cart1: Body1D;
  cart2: Body1D;
  time: number;
  trueF12: number;
  trueF21: number;
  measuredF12: number;
  measuredF21: number;
  s1: SensorState;
  s2: SensorState;
  rand: () => number;
  history: HistoryPoint[];
};

const MASS1 = 1.0;
const SPRING_K = 120;
const REST_LENGTH = 0.6;
const TRACK_LEFT = -1.0;
const TRACK_RIGHT = 1.0;
const HALF_SIZE = 0.06;
const HISTORY_WINDOW = 260;
const SAMPLE_INTERVAL = 0.02;

const DEFAULT_PARAMS: Params = {
  mass2: 1.2,
  stretch: 0.08,
  springDamping: 2.0,
  sensorHz: 120,
  sensorSmoothing: 0.22,
  sensorNoise: 0.08,
  sensorOffset: 0,
};

const DATASET_ID = "ch10-s01-force-sensor";

function normalizeParams(input?: Partial<Params>): Params {
  return {
    ...DEFAULT_PARAMS,
    ...input,
  };
}

function buildState(input: Partial<Params>): State {
  const params = normalizeParams(input);
  const separation = REST_LENGTH + params.stretch;
  const cart1: Body1D = {
    x: -0.5 * separation,
    v: 0,
    m: MASS1,
    halfSize: HALF_SIZE,
  };
  const cart2: Body1D = {
    x: 0.5 * separation,
    v: 0,
    m: Math.max(0.2, params.mass2),
    halfSize: HALF_SIZE,
  };
  const rand = createMulberry32(
    13 +
      Math.floor(params.mass2 * 1000) * 19 +
      Math.floor(params.stretch * 10000) * 23
  );
  return {
    cart1,
    cart2,
    time: 0,
    trueF12: 0,
    trueF21: 0,
    measuredF12: 0,
    measuredF21: 0,
    s1: createSensorState(0),
    s2: createSensorState(0),
    rand,
    history: [],
  };
}

function springForce(state: State, params: Params) {
  const r = state.cart2.x - state.cart1.x;
  const relV = state.cart2.v - state.cart1.v;
  const extension = r - REST_LENGTH;
  return SPRING_K * extension + params.springDamping * relV;
}

function stepState(state: State, input: Partial<Params>, dt: number) {
  const params = normalizeParams(input);
  const f12 = springForce(state, params);
  const f21 = -f12;
  state.trueF12 = f12;
  state.trueF21 = f21;

  integrateBody(state.cart1, f12, dt);
  integrateBody(state.cart2, f21, dt);

  resolveWallContact(state.cart1, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: 0.92,
    bufferDamping: 0.15,
  });
  resolveWallContact(state.cart2, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: 0.92,
    bufferDamping: 0.15,
  });

  const sensorConfig = {
    sampleHz: params.sensorHz,
    smoothing: params.sensorSmoothing,
    noiseStd: params.sensorNoise,
    offset: params.sensorOffset,
  };
  state.measuredF12 = updateSensor(
    state.s1,
    state.trueF12,
    dt,
    sensorConfig,
    state.rand
  );
  state.measuredF21 = updateSensor(
    state.s2,
    state.trueF21,
    dt,
    sensorConfig,
    state.rand
  );

  state.time += dt;
  if (
    state.history.length === 0 ||
    state.time - state.history[state.history.length - 1].t >= SAMPLE_INTERVAL
  ) {
    const measuredBalance = state.measuredF12 + state.measuredF21;
    state.history.push({
      t: state.time,
      trueF12: state.trueF12,
      trueF21: state.trueF21,
      measuredF12: state.measuredF12,
      measuredF21: state.measuredF21,
      measuredBalance,
    });
    if (state.history.length > HISTORY_WINDOW) {
      state.history.shift();
    }
  }
}

function measuredNorm(state: State) {
  return (
    Math.abs(state.measuredF12 + state.measuredF21) /
    Math.max(1e-6, Math.abs(state.measuredF12) + Math.abs(state.measuredF21))
  );
}

function trueNorm(state: State) {
  return (
    Math.abs(state.trueF12 + state.trueF21) /
    Math.max(1e-6, Math.abs(state.trueF12) + Math.abs(state.trueF21))
  );
}

function benchmarkResidual(state: State) {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  if (!profile || !state.history.length) {
    return 0;
  }
  const simulated = state.history
    .filter((point) => point.t <= 0.55)
    .map((point) => ({ x: point.t, y: point.measuredBalance }));
  return seriesRmsResidual(simulated, benchmarkSeries(profile));
}

function metrics(state: State): MetricValue[] {
  const trueBalance = state.trueF12 + state.trueF21;
  const measuredBalance = state.measuredF12 + state.measuredF21;
  const measuredBalanceNorm = measuredNorm(state);
  const residualSigma = benchmarkResidual(state);

  return [
    { id: "trueF12", label: "True force on cart 1", value: state.trueF12, precision: 3, unit: "N" },
    { id: "trueF21", label: "True force on cart 2", value: state.trueF21, precision: 3, unit: "N" },
    { id: "measuredF12", label: "Measured force on cart 1", value: state.measuredF12, precision: 3, unit: "N" },
    { id: "measuredF21", label: "Measured force on cart 2", value: state.measuredF21, precision: 3, unit: "N" },
    decorateMetric(
      {
        id: "true_force_balance",
        label: "True F12 + F21",
        value: trueBalance,
        precision: 5,
        unit: "N",
      },
      0,
      1e-4
    ),
    decorateMetric(
      {
        id: "measured_force_balance",
        label: "Measured F12 + F21",
        value: measuredBalance,
        precision: 4,
        unit: "N",
      },
      0,
      0.12
    ),
    decorateMetric(
      {
        id: "measured_force_balance_norm",
        label: "|Measured balance| / (|F12| + |F21|)",
        value: measuredBalanceNorm,
        precision: 4,
      },
      0,
      0.02
    ),
    decorateMetric(
      {
        id: "dataset_residual_sigma",
        label: "Dataset residual (sigma RMS)",
        value: residualSigma,
        precision: 3,
      },
      0,
      2
    ),
  ];
}

function charts(state: State): ChartSpec[] {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  return [
    {
      id: "forces",
      title: "True vs measured force channels",
      xLabel: "time (s)",
      yLabel: "force (N)",
      series: [
        {
          id: "true-f12",
          label: "true F12",
          data: state.history.map((point) => ({ x: point.t, y: point.trueF12 })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "true-f21",
          label: "true F21",
          data: state.history.map((point) => ({ x: point.t, y: point.trueF21 })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "measured-f12",
          label: "measured F12",
          data: state.history.map((point) => ({ x: point.t, y: point.measuredF12 })),
          color: "#f97316",
          role: "simulation",
        },
        {
          id: "measured-f21",
          label: "measured F21",
          data: state.history.map((point) => ({ x: point.t, y: point.measuredF21 })),
          color: "#0d9488",
          role: "simulation",
        },
      ],
    },
    {
      id: "balance",
      title: "Measured force-pair balance",
      xLabel: "time (s)",
      yLabel: "F12 + F21 (N)",
      series: [
        {
          id: "measured-balance",
          label: "measured balance",
          data: state.history.map((point) => ({ x: point.t, y: point.measuredBalance })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "true-balance",
          label: "true balance",
          data: state.history.map((point) => ({
            x: point.t,
            y: point.trueF12 + point.trueF21,
          })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "dataset",
          label: "dataset reference",
          data: profile
            ? benchmarkSeries(profile).map((point) => ({ x: point.x, y: point.y }))
            : [],
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s01-newton-s-third-law",
  title: "Action and Reaction (SI Sensor Model)",
  summary:
    "A damped spring pair in SI units with sensor sampling, smoothing, offset, and noise. Compare true force symmetry against measured channels.",
  archetype: "Action-Reaction Pair",
  simulation: {
    fixedDt: 1 / 300,
    maxSubSteps: 24,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "1D spring-damper coupling between two carts.",
      "Force sensors are modeled with finite sampling and low-pass response.",
      "Track walls are buffered, not perfectly rigid.",
    ],
    validRange: [
      "cart 2 mass in [0.3, 3.0] kg",
      "initial stretch in [0.01, 0.20] m",
      "sensor Hz in [20, 400]",
    ],
    sources: getBenchmarkSources("v1-ch10-s01-newton-s-third-law"),
    notes:
      "Quantitative gate uses measured force-pair residual normalized by measured force amplitude.",
  },
  params: [
    {
      id: "mass2",
      label: "cart 2 mass",
      min: 0.3,
      max: 3.0,
      step: 0.05,
      unit: "kg",
      default: DEFAULT_PARAMS.mass2,
    },
    {
      id: "stretch",
      label: "initial spring stretch",
      min: 0.01,
      max: 0.2,
      step: 0.005,
      unit: "m",
      default: DEFAULT_PARAMS.stretch,
    },
    {
      id: "springDamping",
      label: "spring damping c",
      min: 0,
      max: 8,
      step: 0.1,
      unit: "N*s/m",
      default: DEFAULT_PARAMS.springDamping,
    },
    {
      id: "sensorHz",
      label: "sensor sample rate",
      group: "advanced",
      min: 20,
      max: 400,
      step: 5,
      unit: "Hz",
      default: DEFAULT_PARAMS.sensorHz,
    },
    {
      id: "sensorSmoothing",
      label: "sensor smoothing",
      group: "advanced",
      min: 0.02,
      max: 1,
      step: 0.02,
      default: DEFAULT_PARAMS.sensorSmoothing,
    },
    {
      id: "sensorNoise",
      label: "sensor noise std",
      group: "advanced",
      min: 0,
      max: 0.3,
      step: 0.01,
      unit: "N",
      default: DEFAULT_PARAMS.sensorNoise,
    },
    {
      id: "sensorOffset",
      label: "sensor offset",
      group: "advanced",
      min: -0.2,
      max: 0.2,
      step: 0.005,
      unit: "N",
      default: DEFAULT_PARAMS.sensorOffset,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, _params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const midY = size.height / 2;
    const mapX = (x: number) =>
      size.width * 0.08 + ((x - TRACK_LEFT) / (TRACK_RIGHT - TRACK_LEFT)) * size.width * 0.84;

    ctx.strokeStyle = "#cbd5f5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size.width * 0.08, midY);
    ctx.lineTo(size.width * 0.92, midY);
    ctx.stroke();

    const x1 = mapX(state.cart1.x);
    const x2 = mapX(state.cart2.x);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, midY);
    ctx.lineTo(x2, midY);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x1 - 16, midY - 12, 32, 24);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(x2 - 16, midY - 12, 32, 24);

    const arrowScale = 8;
    ctx.strokeStyle = "#0284c7";
    ctx.beginPath();
    ctx.moveTo(x1, midY - 20);
    ctx.lineTo(x1 + state.measuredF12 * arrowScale, midY - 20);
    ctx.stroke();

    ctx.strokeStyle = "#0d9488";
    ctx.beginPath();
    ctx.moveTo(x2, midY + 20);
    ctx.lineTo(x2 + state.measuredF21 * arrowScale, midY + 20);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("measured F12", x1 + state.measuredF12 * arrowScale, midY - 26);
    ctx.fillText("measured F21", x2 + state.measuredF21 * arrowScale, midY + 34);
  },
  metrics: (state) => metrics(state),
  charts: (state) => charts(state),
  validate: (state) => {
    const residualSigma = benchmarkResidual(state);
    return statusFromChecks([
      numericCheck("true-balance", "True force balance norm", trueNorm(state), 0, 1e-3),
      numericCheck(
        "measured-balance",
        "Measured force balance norm",
        measuredNorm(state),
        0,
        0.02
      ),
      numericCheck("dataset-match", "Dataset residual RMS (sigma)", residualSigma, 0, 2),
    ]);
  },
};

export function computeMetrics(input: Partial<Params>) {
  const params = normalizeParams(input);
  const state = buildState(params);
  for (let i = 0; i < 720; i += 1) {
    stepState(state, params, 1 / 360);
  }
  return metrics(state);
}
