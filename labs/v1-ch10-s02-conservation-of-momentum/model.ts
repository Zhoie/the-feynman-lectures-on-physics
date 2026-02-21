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
  resolveBodyCollision,
  resolveWallContact,
  rollingResistanceForce,
  slopeForce,
  viscousForce,
  type Body1D,
  type ResistanceConfig,
} from "@/labs/v1-ch10-shared/physics";

type Params = {
  mass1: number;
  mass2: number;
  v1: number;
  v2: number;
  restitution: number;
  pulseForce: number;
  pulseDuration: number;
  rollingMu: number;
  slopeDeg: number;
  viscousCoeff: number;
};

type State = {
  cart1: Body1D;
  cart2: Body1D;
  time: number;
  p0: number;
  pScale: number;
  com0: number;
  history: { t: number; p: number; com: number; drift: number; pulse: number }[];
};

const TRACK_LEFT = -1.2;
const TRACK_RIGHT = 1.2;
const CART_HALF = 0.07;
const PULSE_START = 0.2;
const DATASET_ID = "ch10-s02-collision-track";
const HISTORY_LIMIT = 240;

const DEFAULT_PARAMS: Params = {
  mass1: 0.8,
  mass2: 1.2,
  v1: 0.7,
  v2: -0.25,
  restitution: 0.93,
  pulseForce: 0,
  pulseDuration: 0.18,
  rollingMu: 0,
  slopeDeg: 0,
  viscousCoeff: 0,
};

function normalizeParams(input?: Partial<Params>): Params {
  return {
    ...DEFAULT_PARAMS,
    ...input,
  };
}

function momentum(state: State) {
  return state.cart1.m * state.cart1.v + state.cart2.m * state.cart2.v;
}

function centerOfMass(state: State) {
  return (
    (state.cart1.m * state.cart1.x + state.cart2.m * state.cart2.x) /
    (state.cart1.m + state.cart2.m)
  );
}

function buildState(input: Partial<Params>): State {
  const params = normalizeParams(input);
  const cart1: Body1D = {
    x: -0.55,
    v: params.v1,
    m: Math.max(0.2, params.mass1),
    halfSize: CART_HALF,
  };
  const cart2: Body1D = {
    x: 0.55,
    v: params.v2,
    m: Math.max(0.2, params.mass2),
    halfSize: CART_HALF,
  };
  const p0 = cart1.m * cart1.v + cart2.m * cart2.v;
  const pScale = Math.max(1e-6, Math.abs(cart1.m * cart1.v) + Math.abs(cart2.m * cart2.v));
  const com0 = (cart1.m * cart1.x + cart2.m * cart2.x) / (cart1.m + cart2.m);
  return {
    cart1,
    cart2,
    time: 0,
    p0,
    pScale,
    com0,
    history: [],
  };
}

function isIsolated(params: Params) {
  return (
    Math.abs(params.pulseForce) < 1e-9 &&
    Math.abs(params.pulseDuration) < 1e-9 &&
    Math.abs(params.rollingMu) < 1e-9 &&
    Math.abs(params.slopeDeg) < 1e-9 &&
    Math.abs(params.viscousCoeff) < 1e-9
  );
}

function stepState(state: State, input: Partial<Params>, dt: number) {
  const params = normalizeParams(input);
  const resistance: ResistanceConfig = {
    rollingMu: params.rollingMu,
    slopeDeg: params.slopeDeg,
    viscousCoeff: params.viscousCoeff,
  };

  const pulse = {
    start: PULSE_START,
    duration: Math.max(0, params.pulseDuration),
    amplitude: params.pulseForce,
  };
  const forcePulse = externalPulseForce(state.time, pulse);

  const f1 =
    slopeForce(state.cart1, resistance) +
    rollingResistanceForce(state.cart1, resistance) +
    viscousForce(state.cart1, resistance) +
    forcePulse;
  const f2 =
    slopeForce(state.cart2, resistance) +
    rollingResistanceForce(state.cart2, resistance) +
    viscousForce(state.cart2, resistance);

  integrateBody(state.cart1, f1, dt);
  integrateBody(state.cart2, f2, dt);

  resolveBodyCollision(state.cart1, state.cart2, params.restitution);
  resolveWallContact(state.cart1, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: 0.9,
    bufferDamping: 0.12,
  });
  resolveWallContact(state.cart2, {
    left: TRACK_LEFT,
    right: TRACK_RIGHT,
    wallRestitution: 0.9,
    bufferDamping: 0.12,
  });

  state.time += dt;
  if (
    state.history.length === 0 ||
    state.time - state.history[state.history.length - 1].t > 0.02
  ) {
    const p = momentum(state);
    const com = centerOfMass(state);
    const drift = Math.abs(p - state.p0) / state.pScale;
    state.history.push({
      t: state.time,
      p,
      com,
      drift,
      pulse: forcePulse,
    });
    if (state.history.length > HISTORY_LIMIT) {
      state.history.shift();
    }
  }
}

function datasetResidual(state: State) {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  if (!profile) return 0;
  const sim = state.history
    .filter((point) => point.t >= 0.1 && point.t <= 0.5)
    .map((point) => ({ x: point.t, y: point.drift }));
  return seriesRmsResidual(sim, benchmarkSeries(profile));
}

function metrics(state: State, params: Params): MetricValue[] {
  const p = momentum(state);
  const drift = Math.abs(p - state.p0) / state.pScale;
  const com = centerOfMass(state);
  const comDrift = Math.abs(com - state.com0);
  const residualSigma = datasetResidual(state);
  const isolated = isIsolated(params);
  const driftTolerance = isolated ? 0.01 : 0.04;

  return [
    decorateMetric(
      { id: "momentum", label: "Total momentum", value: p, precision: 4, unit: "kg*m/s" },
      state.p0,
      Math.max(1e-3, state.pScale * driftTolerance)
    ),
    decorateMetric(
      {
        id: "drift",
        label: "Momentum drift (normalized)",
        value: drift,
        precision: 5,
      },
      0,
      driftTolerance
    ),
    decorateMetric(
      {
        id: "com_drift",
        label: "Center-of-mass drift",
        value: comDrift,
        precision: 4,
        unit: "m",
      },
      0,
      0.01
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
      id: "momentum",
      title: "Momentum vs time",
      xLabel: "time (s)",
      yLabel: "p (kg*m/s)",
      series: [
        {
          id: "p",
          label: "p total",
          data: state.history.map((point) => ({ x: point.t, y: point.p })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "p-ref",
          label: "initial p",
          data: state.history.map((point) => ({ x: point.t, y: state.p0 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "drift",
      title: "Normalized momentum drift",
      xLabel: "time (s)",
      yLabel: "drift",
      series: [
        {
          id: "drift",
          label: "simulated drift",
          data: state.history.map((point) => ({ x: point.t, y: point.drift })),
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
    {
      id: "pulse",
      title: "Applied force pulse",
      xLabel: "time (s)",
      yLabel: "force (N)",
      series: [
        {
          id: "pulse",
          label: "external force on cart 1",
          data: state.history.map((point) => ({ x: point.t, y: point.pulse })),
          color: "#f97316",
          role: "simulation",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s02-conservation-of-momentum",
  title: "Isolated Collisions and the Center of Mass (SI)",
  summary:
    "Two carts evolve on an explicit track with bumpers, finite-duration forcing, and optional rolling/slope losses. Conservation gates only apply in isolated mode.",
  archetype: "Collision + COM",
  simulation: {
    fixedDt: 1 / 360,
    maxSubSteps: 28,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "1D finite-size carts with explicit wall contacts.",
      "External forcing is finite-duration pulse, not persistent ideal acceleration.",
      "Isolation checks only valid when pulse/loss/slope terms are disabled.",
    ],
    validRange: [
      "mass in [0.2, 3.0] kg",
      "velocity in [-1.5, 1.5] m/s",
      "restitution in [0.2, 1.0]",
    ],
    sources: getBenchmarkSources("v1-ch10-s02-conservation-of-momentum"),
  },
  params: [
    {
      id: "mass1",
      label: "mass 1",
      min: 0.2,
      max: 3.0,
      step: 0.05,
      unit: "kg",
      default: DEFAULT_PARAMS.mass1,
    },
    {
      id: "mass2",
      label: "mass 2",
      min: 0.2,
      max: 3.0,
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
      label: "collision restitution",
      min: 0.2,
      max: 1,
      step: 0.02,
      default: DEFAULT_PARAMS.restitution,
    },
    {
      id: "pulseForce",
      label: "external pulse force",
      min: 0,
      max: 10,
      step: 0.1,
      unit: "N",
      default: DEFAULT_PARAMS.pulseForce,
    },
    {
      id: "pulseDuration",
      label: "pulse duration",
      min: 0,
      max: 0.6,
      step: 0.01,
      unit: "s",
      default: DEFAULT_PARAMS.pulseDuration,
      visibleWhen: (params) => (params.pulseForce ?? 0) > 0,
    },
    {
      id: "rollingMu",
      label: "rolling friction coefficient",
      group: "advanced",
      min: 0,
      max: 0.05,
      step: 0.001,
      default: DEFAULT_PARAMS.rollingMu,
    },
    {
      id: "slopeDeg",
      label: "track slope angle",
      group: "advanced",
      min: -2,
      max: 2,
      step: 0.05,
      unit: "deg",
      default: DEFAULT_PARAMS.slopeDeg,
    },
    {
      id: "viscousCoeff",
      label: "viscous drag coefficient",
      group: "advanced",
      min: 0,
      max: 0.6,
      step: 0.01,
      unit: "N*s/m",
      default: DEFAULT_PARAMS.viscousCoeff,
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

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(size.width * 0.08 - 8, midY - 24, 8, 48);
    ctx.fillRect(size.width * 0.92, midY - 24, 8, 48);

    const x1 = mapX(state.cart1.x);
    const x2 = mapX(state.cart2.x);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x1 - 16, midY - 12, 32, 24);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(x2 - 16, midY - 12, 32, 24);

    const com = centerOfMass(state);
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.arc(mapX(com), midY - 24, 5, 0, Math.PI * 2);
    ctx.fill();
  },
  metrics: (state, params) => metrics(state, normalizeParams(params)),
  charts: (state) => charts(state),
  validate: (state, params) => {
    const normalized = normalizeParams(params);
    const drift = Math.abs(momentum(state) - state.p0) / state.pScale;
    const residualSigma = datasetResidual(state);
    const isolated = isIsolated(normalized);
    return statusFromChecks(
      [
        numericCheck(
          "momentum-drift",
          "Momentum drift (normalized)",
          drift,
          0,
          isolated ? 0.01 : 0.04
        ),
        numericCheck("dataset-match", "Dataset residual RMS (sigma)", residualSigma, 0, 2),
      ],
      isolated
        ? []
        : ["Isolation gate disabled: external pulse or dissipation terms are active."]
    );
  },
};

export function computeMetrics(input: Partial<Params>) {
  const params = normalizeParams(input);
  const state = buildState(params);
  for (let i = 0; i < 900; i += 1) {
    stepState(state, params, 1 / 450);
  }
  return metrics(state, params);
}
