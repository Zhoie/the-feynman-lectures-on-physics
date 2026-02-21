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
  externalPulseForce,
  integrateBody,
  pulseFromImpulse,
  resolveWallContact,
  type Body1D,
} from "@/labs/v1-ch10-shared/physics";

type Params = {
  mass: number;
  releaseImpulse: number;
  releaseDuration: number;
  asymmetry: number;
  fixtureFriction: number;
  wallRestitution: number;
};

type HistoryPoint = {
  t: number;
  pLeft: number;
  pRight: number;
  pTotal: number;
  kinetic: number;
  com: number;
  comDrift: number;
  pDrift: number;
  forceLeft: number;
  forceRight: number;
};

type State = {
  left: Body1D;
  right: Body1D;
  time: number;
  com0: number;
  pScale: number;
  firstWallContactTime: number | null;
  history: HistoryPoint[];
};

const TRACK_LEFT = -1.35;
const TRACK_RIGHT = 1.35;
const TRACK_LENGTH = TRACK_RIGHT - TRACK_LEFT;
const HALF_SIZE = 0.065;
const RELEASE_START = 0.05;
const HISTORY_LIMIT = 320;
const SAMPLE_INTERVAL = 0.01;
const DATASET_ID = "ch10-s03-recoil";

const DEFAULT_PARAMS: Params = {
  mass: 1.0,
  releaseImpulse: 0.28,
  releaseDuration: 0.08,
  asymmetry: 0,
  fixtureFriction: 0,
  wallRestitution: 0.95,
};

function normalizeParams(input?: Partial<Params>): Params {
  return {
    ...DEFAULT_PARAMS,
    ...input,
  };
}

function buildState(input?: Partial<Params>): State {
  const params = normalizeParams(input);
  const mass = Math.max(0.2, params.mass);
  const left: Body1D = {
    x: -0.12,
    v: 0,
    m: mass,
    halfSize: HALF_SIZE,
  };
  const right: Body1D = {
    x: 0.12,
    v: 0,
    m: mass,
    halfSize: HALF_SIZE,
  };
  const com0 = (left.x + right.x) * 0.5;
  return {
    left,
    right,
    time: 0,
    com0,
    pScale: Math.max(1e-6, 2 * Math.abs(params.releaseImpulse)),
    firstWallContactTime: null,
    history: [],
  };
}

function momentumOf(body: Body1D) {
  return body.m * body.v;
}

function centerOfMass(state: State) {
  const totalMass = state.left.m + state.right.m;
  return (state.left.m * state.left.x + state.right.m * state.right.x) / Math.max(1e-9, totalMass);
}

function kineticEnergy(state: State) {
  return (
    0.5 * state.left.m * state.left.v * state.left.v +
    0.5 * state.right.m * state.right.v * state.right.v
  );
}

function analysisWindow(state: State) {
  if (!state.history.length) return state.history;
  if (state.firstWallContactTime == null) return state.history;
  return state.history.filter((point) => point.t <= state.firstWallContactTime);
}

function windowMomentumDrift(state: State) {
  const points = analysisWindow(state);
  if (!points.length) return 0;
  let maxDrift = 0;
  for (const point of points) {
    maxDrift = Math.max(maxDrift, Math.abs(point.pTotal) / state.pScale);
  }
  return maxDrift;
}

function windowComDriftNorm(state: State) {
  const points = analysisWindow(state);
  if (!points.length) return 0;
  let maxDrift = 0;
  for (const point of points) {
    maxDrift = Math.max(maxDrift, Math.abs(point.comDrift) / TRACK_LENGTH);
  }
  return maxDrift;
}

function datasetResidual(state: State) {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  if (!profile) return 0;
  const window = analysisWindow(state)
    .filter((point) => point.t <= 0.35)
    .map((point) => ({ x: point.t, y: Math.abs(point.comDrift) }));
  return seriesRmsResidual(window, benchmarkSeries(profile));
}

function preWallEnergyRatio(state: State) {
  const window = analysisWindow(state).filter(
    (point) => point.t >= RELEASE_START + 0.1
  );
  if (window.length < 6) return 1;
  const split = Math.floor(window.length / 2);
  const early = window.slice(0, split);
  const late = window.slice(split);
  const avg = (points: HistoryPoint[]) =>
    points.reduce((sum, point) => sum + point.kinetic, 0) /
    Math.max(1, points.length);
  const pre = avg(early);
  const post = avg(late);
  return pre > 0 ? post / pre : 1;
}

function stepState(state: State, input: Partial<Params>, dt: number) {
  const params = normalizeParams(input);
  const pulse = pulseFromImpulse(
    RELEASE_START,
    Math.max(0.01, params.releaseDuration),
    Math.max(0, params.releaseImpulse)
  );
  const baseForce = externalPulseForce(state.time, pulse);

  const asym = Math.max(-0.25, Math.min(0.25, params.asymmetry));
  const forceLeft = -baseForce * (1 + asym) - params.fixtureFriction * state.left.v;
  const forceRight = baseForce * (1 - asym) - params.fixtureFriction * state.right.v;

  integrateBody(state.left, forceLeft, dt);
  integrateBody(state.right, forceRight, dt);

  const hitLeft = resolveWallContact(state.left, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: params.wallRestitution,
    bufferDamping: 0.08,
  });
  const hitRight = resolveWallContact(state.right, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: params.wallRestitution,
    bufferDamping: 0.08,
  });

  state.time += dt;
  if ((hitLeft || hitRight) && state.firstWallContactTime == null) {
    state.firstWallContactTime = state.time;
  }

  if (
    state.history.length === 0 ||
    state.time - state.history[state.history.length - 1].t >= SAMPLE_INTERVAL
  ) {
    const pLeft = momentumOf(state.left);
    const pRight = momentumOf(state.right);
    const pTotal = pLeft + pRight;
    const kinetic = kineticEnergy(state);
    const com = centerOfMass(state);
    const comDrift = com - state.com0;
    const pDrift = Math.abs(pTotal) / state.pScale;
    state.history.push({
      t: state.time,
      pLeft,
      pRight,
      pTotal,
      kinetic,
      com,
      comDrift,
      pDrift,
      forceLeft,
      forceRight,
    });
    if (state.history.length > HISTORY_LIMIT) {
      state.history.shift();
    }
  }
}

function metrics(state: State): MetricValue[] {
  const point = state.history[state.history.length - 1];
  const pLeft = point?.pLeft ?? momentumOf(state.left);
  const pRight = point?.pRight ?? momentumOf(state.right);
  const pTotal = point?.pTotal ?? pLeft + pRight;
  const pDrift = windowMomentumDrift(state);
  const comDriftNorm = windowComDriftNorm(state);
  const energyRatio = preWallEnergyRatio(state);
  const residualSigma = datasetResidual(state);

  return [
    { id: "p_left", label: "Left cart momentum", value: pLeft, precision: 4, unit: "kg*m/s" },
    { id: "p_right", label: "Right cart momentum", value: pRight, precision: 4, unit: "kg*m/s" },
    decorateMetric(
      {
        id: "p_total",
        label: "Total momentum",
        value: pTotal,
        precision: 5,
        unit: "kg*m/s",
      },
      0,
      Math.max(1e-5, state.pScale * 0.01)
    ),
    decorateMetric(
      {
        id: "momentum_drift_norm",
        label: "Momentum drift in pre-wall window",
        value: pDrift,
        precision: 5,
      },
      0,
      0.01
    ),
    decorateMetric(
      {
        id: "com_drift_norm",
        label: "COM drift / track length (pre-wall)",
        value: comDriftNorm,
        precision: 5,
      },
      0,
      0.005
    ),
    decorateMetric(
      {
        id: "energy_window_ratio",
        label: "Energy ratio in pre-wall window",
        value: energyRatio,
        precision: 4,
      },
      1,
      0.05
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
  const profileSeries = profile ? benchmarkSeries(profile) : [];
  const preWall = analysisWindow(state);
  const energyRef = preWall[0]?.kinetic ?? 0;
  return [
    {
      id: "momentum",
      title: "Recoil momentum channels",
      xLabel: "time (s)",
      yLabel: "p (kg*m/s)",
      series: [
        {
          id: "left",
          label: "left cart",
          data: state.history.map((point) => ({ x: point.t, y: point.pLeft })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "right",
          label: "right cart",
          data: state.history.map((point) => ({ x: point.t, y: point.pRight })),
          color: "#f97316",
          role: "simulation",
        },
        {
          id: "total",
          label: "p total",
          data: state.history.map((point) => ({ x: point.t, y: point.pTotal })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "ref-zero",
          label: "reference zero",
          data: state.history.map((point) => ({ x: point.t, y: 0 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "energy-window",
      title: "Pre-wall energy window",
      xLabel: "time (s)",
      yLabel: "K (J)",
      series: [
        {
          id: "energy",
          label: "kinetic energy",
          data: preWall.map((point) => ({
            x: point.t,
            y: point.kinetic,
          })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "energy-ref",
          label: "initial pre-window level",
          data: preWall.map((point) => ({
            x: point.t,
            y: energyRef,
          })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "com-drift",
      title: "Center-of-mass drift before wall contact",
      xLabel: "time (s)",
      yLabel: "|COM drift| (m)",
      series: [
        {
          id: "sim",
          label: "simulation",
          data: analysisWindow(state).map((point) => ({ x: point.t, y: Math.abs(point.comDrift) })),
          color: "#0f172a",
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
    {
      id: "release",
      title: "Finite release-force profile",
      xLabel: "time (s)",
      yLabel: "force (N)",
      series: [
        {
          id: "left-force",
          label: "left force",
          data: state.history.map((point) => ({ x: point.t, y: point.forceLeft })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "right-force",
          label: "right force",
          data: state.history.map((point) => ({ x: point.t, y: point.forceRight })),
          color: "#f97316",
          role: "simulation",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s03-momentum-is-conserved",
  title: "Recoil Momentum in a Finite Release Window (SI)",
  summary:
    "Two identical carts receive a finite-duration impulse pair. Pre-wall validation checks total momentum, center-of-mass drift, and dataset residuals.",
  archetype: "Recoil Conservation",
  simulation: {
    fixedDt: 1 / 420,
    maxSubSteps: 30,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "Finite-duration release impulse applied as an action-reaction pair.",
      "Validation window is limited to pre-first-wall-contact data.",
      "Asymmetry and fixture friction model apparatus imperfections.",
    ],
    validRange: [
      "mass in [0.2, 4.0] kg",
      "release impulse in [0.02, 0.8] N*s",
      "release duration in [0.01, 0.30] s",
    ],
    sources: getBenchmarkSources("v1-ch10-s03-momentum-is-conserved"),
    notes:
      "Primary acceptance gates: normalized momentum drift <= 1.0%, COM drift <= 0.5% track length.",
  },
  params: [
    {
      id: "mass",
      label: "cart mass",
      min: 0.2,
      max: 4.0,
      step: 0.05,
      unit: "kg",
      default: DEFAULT_PARAMS.mass,
    },
    {
      id: "releaseImpulse",
      label: "release impulse",
      min: 0.02,
      max: 0.8,
      step: 0.01,
      unit: "N*s",
      default: DEFAULT_PARAMS.releaseImpulse,
    },
    {
      id: "releaseDuration",
      label: "release duration",
      min: 0.01,
      max: 0.3,
      step: 0.005,
      unit: "s",
      default: DEFAULT_PARAMS.releaseDuration,
    },
    {
      id: "asymmetry",
      label: "release asymmetry",
      group: "advanced",
      min: -0.2,
      max: 0.2,
      step: 0.005,
      default: DEFAULT_PARAMS.asymmetry,
    },
    {
      id: "fixtureFriction",
      label: "fixture friction",
      group: "advanced",
      min: 0,
      max: 0.25,
      step: 0.005,
      unit: "N*s/m",
      default: DEFAULT_PARAMS.fixtureFriction,
    },
    {
      id: "wallRestitution",
      label: "wall restitution",
      group: "advanced",
      min: 0.7,
      max: 1,
      step: 0.01,
      default: DEFAULT_PARAMS.wallRestitution,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, _params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const midY = size.height / 2;
    const trackLeft = size.width * 0.08;
    const trackRight = size.width * 0.92;
    const trackWidth = trackRight - trackLeft;
    const mapX = (x: number) =>
      trackLeft + ((x - TRACK_LEFT) / TRACK_LENGTH) * trackWidth;

    ctx.strokeStyle = "#cbd5f5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trackLeft, midY);
    ctx.lineTo(trackRight, midY);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(trackLeft - 8, midY - 26, 8, 52);
    ctx.fillRect(trackRight, midY - 26, 8, 52);

    const xLeft = mapX(state.left.x);
    const xRight = mapX(state.right.x);

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(xLeft - 16, midY - 12, 32, 24);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(xRight - 16, midY - 12, 32, 24);

    const comX = mapX(centerOfMass(state));
    ctx.strokeStyle = "#0284c7";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(comX - 6, midY - 20);
    ctx.lineTo(comX + 6, midY - 20);
    ctx.moveTo(comX, midY - 26);
    ctx.lineTo(comX, midY - 14);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("COM", comX - 12, midY - 30);
  },
  metrics: (state) => metrics(state),
  charts: (state) => charts(state),
  validate: (state) => {
    const pDrift = windowMomentumDrift(state);
    const comDriftNorm = windowComDriftNorm(state);
    const energyRatio = preWallEnergyRatio(state);
    const residualSigma = datasetResidual(state);
    const warnings: string[] = [];
    if (state.firstWallContactTime != null && state.firstWallContactTime < 0.2) {
      warnings.push("Pre-wall observation window is short; lower impulse or increase track margin.");
    }
    return statusFromChecks(
      [
        numericCheck("momentum-drift", "Momentum drift (normalized)", pDrift, 0, 0.01),
        numericCheck("com-drift", "COM drift / track length", comDriftNorm, 0, 0.005),
        numericCheck("energy-window", "Pre-wall energy ratio", energyRatio, 1, 0.05),
        numericCheck("dataset-match", "Dataset residual RMS (sigma)", residualSigma, 0, 2),
      ],
      warnings
    );
  },
};

export function computeMetrics(input: Partial<Params>) {
  const params = normalizeParams(input);
  const state = buildState(params);
  const totalTime = 1.2;
  const steps = Math.floor(totalTime * 480);
  const dt = totalTime / steps;
  for (let i = 0; i < steps; i += 1) {
    stepState(state, params, dt);
  }
  return metrics(state);
}
