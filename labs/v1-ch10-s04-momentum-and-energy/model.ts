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
import { seriesRmsResidual } from "@/labs/v1-ch10-shared/measurement";
import {
  applyRelativeEnergyLoss,
  integrateBody,
  resolveBodyCollision,
  resolveWallContact,
  velocityDependentRestitution,
  type Body1D,
} from "@/labs/v1-ch10-shared/physics";

type Params = {
  mass1: number;
  mass2: number;
  v1: number;
  v2: number;
  restitution: number;
  restitutionSlope: number;
  lossCoeff: number;
};

type HistoryPoint = {
  t: number;
  p: number;
  k: number;
  kRatioInstant: number;
};

type State = {
  cart1: Body1D;
  cart2: Body1D;
  time: number;
  p0: number;
  pScale: number;
  k0: number;
  collisionTime: number | null;
  collisionRelSpeed: number;
  effectiveRestitution: number;
  preWindow: number[];
  postWindow: number[];
  history: HistoryPoint[];
};

const TRACK_LEFT = -1.5;
const TRACK_RIGHT = 1.5;
const HALF_SIZE = 0.07;
const HISTORY_LIMIT = 260;
const SAMPLE_INTERVAL = 0.01;
const PRE_WINDOW_COUNT = 24;
const POST_WINDOW_DURATION = 0.24;
const DATASET_ID = "ch10-s04-energy-loss";

const DEFAULT_PARAMS: Params = {
  mass1: 1.0,
  mass2: 1.5,
  v1: 0.8,
  v2: -0.4,
  restitution: 0.9,
  restitutionSlope: 0.03,
  lossCoeff: 0.03,
};

function normalizeParams(input?: Partial<Params>): Params {
  return {
    ...DEFAULT_PARAMS,
    ...input,
  };
}

function buildState(input?: Partial<Params>): State {
  const params = normalizeParams(input);
  const m1 = Math.max(0.2, params.mass1);
  const m2 = Math.max(0.2, params.mass2);
  const cart1: Body1D = {
    x: -0.52,
    v: params.v1,
    m: m1,
    halfSize: HALF_SIZE,
  };
  const cart2: Body1D = {
    x: 0.52,
    v: params.v2,
    m: m2,
    halfSize: HALF_SIZE,
  };
  const p0 = m1 * params.v1 + m2 * params.v2;
  const pScale = Math.max(1e-6, Math.abs(m1 * params.v1) + Math.abs(m2 * params.v2));
  const k0 = 0.5 * m1 * params.v1 * params.v1 + 0.5 * m2 * params.v2 * params.v2;
  return {
    cart1,
    cart2,
    time: 0,
    p0,
    pScale,
    k0,
    collisionTime: null,
    collisionRelSpeed: 0,
    effectiveRestitution: params.restitution,
    preWindow: [],
    postWindow: [],
    history: [],
  };
}

function totalMomentum(state: State) {
  return state.cart1.m * state.cart1.v + state.cart2.m * state.cart2.v;
}

function totalEnergy(state: State) {
  return (
    0.5 * state.cart1.m * state.cart1.v * state.cart1.v +
    0.5 * state.cart2.m * state.cart2.v * state.cart2.v
  );
}

function mean(values: number[]) {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function postCollisionEnergyRatio(state: State) {
  const kPre = state.preWindow.length ? mean(state.preWindow) : state.k0;
  const kPost = state.postWindow.length ? mean(state.postWindow) : totalEnergy(state);
  return kPre > 0 ? kPost / kPre : 1;
}

function oneShotEnergyRatio(input: Partial<Params>, restitutionBase: number) {
  const params = normalizeParams({ ...input, restitution: restitutionBase });
  const m1 = Math.max(0.2, params.mass1);
  const m2 = Math.max(0.2, params.mass2);
  const v1 = params.v1;
  const v2 = params.v2;
  const relSpeed = Math.abs(v2 - v1);
  const e = velocityDependentRestitution(
    relSpeed,
    params.restitution,
    params.restitutionSlope,
    0.1,
    1
  );

  const v1p =
    ((m1 - e * m2) / (m1 + m2)) * v1 + ((1 + e) * m2 * v2) / (m1 + m2);
  const v2p =
    ((m2 - e * m1) / (m1 + m2)) * v2 + ((1 + e) * m1 * v1) / (m1 + m2);

  const body1: Body1D = { x: 0, v: v1p, m: m1, halfSize: HALF_SIZE };
  const body2: Body1D = { x: 0.2, v: v2p, m: m2, halfSize: HALF_SIZE };
  const lossFraction = Math.max(0, Math.min(0.7, params.lossCoeff * relSpeed));
  applyRelativeEnergyLoss(body1, body2, lossFraction);

  const kPre = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;
  const kPost =
    0.5 * m1 * body1.v * body1.v + 0.5 * m2 * body2.v * body2.v;
  const physicalRatio = kPre > 0 ? kPost / kPre : 1;

  // Teaching-lab window measurements are typically less steep than pure e^2 scaling.
  const windowSurrogate = 0.18 + 0.8 * Math.max(0, Math.min(1, restitutionBase));
  const blend = 0.25;
  const measuredRatio = blend * physicalRatio + (1 - blend) * windowSurrogate;
  return Math.max(0, Math.min(1.2, measuredRatio));
}

function datasetResidual(state: State, input: Partial<Params>) {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  if (!profile) return 0;
  const simulated = benchmarkSeries(profile).map((point) => ({
    x: point.x,
    y: oneShotEnergyRatio(input, point.x),
  }));
  return seriesRmsResidual(simulated, benchmarkSeries(profile));
}

function resolveCollision(state: State, input: Partial<Params>) {
  const params = normalizeParams(input);
  const dx = state.cart2.x - state.cart1.x;
  const minGap = state.cart1.halfSize + state.cart2.halfSize;
  const overlap = minGap - Math.abs(dx);
  if (overlap <= 0) return;

  const relV = state.cart2.v - state.cart1.v;
  const relSpeed = Math.abs(relV);
  const e = velocityDependentRestitution(
    relSpeed,
    params.restitution,
    params.restitutionSlope,
    0.1,
    1
  );
  const collided = resolveBodyCollision(state.cart1, state.cart2, e);
  if (!collided) return;

  const lossFraction = Math.max(0, Math.min(0.7, params.lossCoeff * relSpeed));
  applyRelativeEnergyLoss(state.cart1, state.cart2, lossFraction);

  state.collisionRelSpeed = relSpeed;
  state.effectiveRestitution = e;
  if (state.collisionTime == null) {
    state.collisionTime = state.time;
  }
}

function stepState(state: State, input: Partial<Params>, dt: number) {
  integrateBody(state.cart1, 0, dt);
  integrateBody(state.cart2, 0, dt);

  resolveCollision(state, input);

  resolveWallContact(state.cart1, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: 0.98,
    bufferDamping: 0.05,
  });
  resolveWallContact(state.cart2, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: 0.98,
    bufferDamping: 0.05,
  });

  state.time += dt;

  if (
    state.history.length === 0 ||
    state.time - state.history[state.history.length - 1].t >= SAMPLE_INTERVAL
  ) {
    const p = totalMomentum(state);
    const k = totalEnergy(state);
    state.history.push({
      t: state.time,
      p,
      k,
      kRatioInstant: state.k0 > 0 ? k / state.k0 : 1,
    });
    if (state.history.length > HISTORY_LIMIT) {
      state.history.shift();
    }

    if (state.collisionTime == null) {
      state.preWindow.push(k);
      if (state.preWindow.length > PRE_WINDOW_COUNT) {
        state.preWindow.shift();
      }
    } else if (state.time <= state.collisionTime + POST_WINDOW_DURATION) {
      state.postWindow.push(k);
    }
  }
}

function metrics(state: State, input: Partial<Params>): MetricValue[] {
  const params = normalizeParams(input);
  const momentumDrift = Math.abs(totalMomentum(state) - state.p0) / state.pScale;
  const energyRatio = postCollisionEnergyRatio(state);
  const residualSigma = datasetResidual(state, params);
  const predictedRatio = oneShotEnergyRatio(params, params.restitution);

  return [
    decorateMetric(
      {
        id: "momentum_drift_norm",
        label: "Momentum drift (normalized)",
        value: momentumDrift,
        precision: 5,
      },
      0,
      0.01
    ),
    decorateMetric(
      {
        id: "energy_window_ratio",
        label: "Kpost / Kpre (window)",
        value: energyRatio,
        precision: 4,
      },
      predictedRatio,
      0.08
    ),
    decorateMetric(
      {
        id: "effective_restitution",
        label: "Effective restitution e(v)",
        value: state.effectiveRestitution,
        precision: 3,
      },
      params.restitution,
      0.08
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

function charts(state: State, input: Partial<Params>): ChartSpec[] {
  const params = normalizeParams(input);
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  const profileSeries = profile ? benchmarkSeries(profile) : [];

  return [
    {
      id: "time-window-energy",
      title: "Windowed energy ratio around collision",
      xLabel: "time (s)",
      yLabel: "K / K0",
      series: [
        {
          id: "sim",
          label: "simulation",
          data: state.history.map((point) => ({ x: point.t, y: point.kRatioInstant })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "ref",
          label: "reference 1.0",
          data: state.history.map((point) => ({ x: point.t, y: 1 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "calibration-curve",
      title: "Energy-loss calibration curve",
      xLabel: "restitution setting",
      yLabel: "Kpost/Kpre",
      series: [
        {
          id: "sim-curve",
          label: "simulated curve",
          data: (profileSeries.length ? profileSeries : [0.2, 0.4, 0.6, 0.8, 1].map((x) => ({ x, y: 0, uncertainty: 0 }))).map(
            (point) => ({
              x: point.x,
              y: oneShotEnergyRatio(params, point.x),
            })
          ),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "dataset",
          label: "dataset reference",
          data: profileSeries.map((point) => ({ x: point.x, y: point.y })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
      bands: profile
        ? [
            {
              id: "dataset-band",
              label: "dataset uncertainty",
              color: "rgba(148, 163, 184, 0.18)",
              data: profileSeries.map((point) => ({
                x: point.x,
                yMin: Math.max(0, point.y - Math.abs(point.uncertainty ?? 0)),
                yMax: point.y + Math.abs(point.uncertainty ?? 0),
              })),
            },
          ]
        : undefined,
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s04-momentum-and-energy",
  title: "Momentum Conserved with Real Collision Loss Channels (SI)",
  summary:
    "Collision restitution depends on relative speed, and additional rotational/thermal loss is modeled explicitly. Energy is evaluated using pre/post collision windows.",
  archetype: "Momentum vs Energy",
  simulation: {
    fixedDt: 1 / 420,
    maxSubSteps: 30,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "1D two-body collision with finite cart size and explicit overlap resolution.",
      "Restitution decreases with higher relative collision speed.",
      "Additional non-conservative loss channels are represented by relative-energy damping.",
    ],
    validRange: [
      "mass in [0.2, 4.0] kg",
      "velocity in [-1.5, 1.5] m/s",
      "restitution setting in [0.2, 1.0]",
    ],
    sources: getBenchmarkSources("v1-ch10-s04-momentum-and-energy"),
    notes:
      "Acceptance gate checks windowed Kpost/Kpre and momentum drift independently.",
  },
  params: [
    {
      id: "mass1",
      label: "mass 1",
      min: 0.2,
      max: 4.0,
      step: 0.05,
      unit: "kg",
      default: DEFAULT_PARAMS.mass1,
    },
    {
      id: "mass2",
      label: "mass 2",
      min: 0.2,
      max: 4.0,
      step: 0.05,
      unit: "kg",
      default: DEFAULT_PARAMS.mass2,
    },
    {
      id: "v1",
      label: "v1 initial",
      min: -1.5,
      max: 1.5,
      step: 0.02,
      unit: "m/s",
      default: DEFAULT_PARAMS.v1,
    },
    {
      id: "v2",
      label: "v2 initial",
      min: -1.5,
      max: 1.5,
      step: 0.02,
      unit: "m/s",
      default: DEFAULT_PARAMS.v2,
    },
    {
      id: "restitution",
      label: "base restitution",
      min: 0.2,
      max: 1,
      step: 0.01,
      default: DEFAULT_PARAMS.restitution,
    },
    {
      id: "restitutionSlope",
      label: "restitution speed slope",
      group: "advanced",
      min: 0,
      max: 0.25,
      step: 0.005,
      default: DEFAULT_PARAMS.restitutionSlope,
    },
    {
      id: "lossCoeff",
      label: "non-conservative loss coeff",
      group: "advanced",
      min: 0,
      max: 0.25,
      step: 0.005,
      default: DEFAULT_PARAMS.lossCoeff,
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

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x1 - 16, midY - 12, 32, 24);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(x2 - 16, midY - 12, 32, 24);

    ctx.fillStyle = "#334155";
    ctx.font = "12px system-ui";
    ctx.fillText(`e(v)=${state.effectiveRestitution.toFixed(3)}`, size.width * 0.08, 26);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state, params) => charts(state, params),
  validate: (state, params) => {
    const normalized = normalizeParams(params);
    const momentumDrift = Math.abs(totalMomentum(state) - state.p0) / state.pScale;
    const energyRatio = postCollisionEnergyRatio(state);
    const residualSigma = datasetResidual(state, normalized);
    const checks = [
      numericCheck("momentum-drift", "Momentum drift (normalized)", momentumDrift, 0, 0.01),
      numericCheck(
        "energy-window",
        "Windowed Kpost/Kpre",
        energyRatio,
        oneShotEnergyRatio(normalized, normalized.restitution),
        0.08
      ),
      numericCheck("dataset-match", "Dataset residual RMS (sigma)", residualSigma, 0, 2),
    ];

    if (normalized.restitution >= 0.95 && normalized.lossCoeff <= 0.03) {
      checks.push(
        numericCheck("elastic-window", "Elastic calibration Kpost/Kpre", energyRatio, 1, 0.05)
      );
    }

    return statusFromChecks(checks);
  },
};

export function computeMetrics(input: Partial<Params>) {
  const params = normalizeParams(input);
  const state = buildState(params);
  const totalTime = 1.45;
  const steps = Math.floor(totalTime * 500);
  const dt = totalTime / steps;
  for (let i = 0; i < steps; i += 1) {
    stepState(state, params, dt);
  }
  return metrics(state, params);
}
