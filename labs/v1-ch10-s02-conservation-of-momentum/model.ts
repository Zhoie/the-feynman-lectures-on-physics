import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";

type Params = {
  mass1: number;
  mass2: number;
  v1: number;
  v2: number;
  restitution: number;
  externalForce: number;
};

type State = {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  time: number;
  p0: number;
  pScale: number;
  history: { t: number; p: number; com: number }[];
};

const RADIUS = 0.08;
const LEFT = -1.1;
const RIGHT = 1.1;

function buildState(params: Params): State {
  const x1 = -0.6;
  const x2 = 0.6;
  const v1 = params.v1;
  const v2 = params.v2;
  const p0 = params.mass1 * v1 + params.mass2 * v2;
  const pScale = Math.max(1e-6, Math.abs(params.mass1 * v1) + Math.abs(params.mass2 * v2));
  return { x1, x2, v1, v2, time: 0, p0, pScale, history: [] };
}

function collide(state: State, params: Params) {
  const dx = state.x2 - state.x1;
  const overlap = 2 * RADIUS - Math.abs(dx);
  if (overlap <= 0) return;
  const relV = state.v2 - state.v1;
  const closing = dx * relV < 0;

  const sign = dx === 0 ? 1 : Math.sign(dx);
  const shift = overlap / 2;
  state.x1 -= sign * shift;
  state.x2 += sign * shift;

  if (!closing) return;

  const m1 = params.mass1;
  const m2 = params.mass2;
  const e = params.restitution;
  const v1 = state.v1;
  const v2 = state.v2;
  const v1p =
    ((m1 - e * m2) / (m1 + m2)) * v1 + ((1 + e) * m2) / (m1 + m2) * v2;
  const v2p =
    ((m2 - e * m1) / (m1 + m2)) * v2 + ((1 + e) * m1) / (m1 + m2) * v1;
  state.v1 = v1p;
  state.v2 = v2p;
}

function stepState(state: State, params: Params, dt: number) {
  const a1 = params.externalForce / params.mass1;
  state.v1 += a1 * dt;

  state.x1 += state.v1 * dt;
  state.x2 += state.v2 * dt;

  if (params.externalForce > 0) {
    if (state.x1 - RADIUS < LEFT) {
      state.x1 = LEFT + RADIUS;
      state.v1 *= -1;
    }
    if (state.x2 + RADIUS > RIGHT) {
      state.x2 = RIGHT - RADIUS;
      state.v2 *= -1;
    }
  } else {
    const span = RIGHT - LEFT;
    if (state.x1 < LEFT) state.x1 += span;
    if (state.x1 > RIGHT) state.x1 -= span;
    if (state.x2 < LEFT) state.x2 += span;
    if (state.x2 > RIGHT) state.x2 -= span;
  }

  collide(state, params);
  state.time += dt;

  if (state.time - (state.history.at(-1)?.t ?? -1) > 0.05) {
    const p = params.mass1 * state.v1 + params.mass2 * state.v2;
    const com = (params.mass1 * state.x1 + params.mass2 * state.x2) / (params.mass1 + params.mass2);
    state.history.push({ t: state.time, p, com });
    if (state.history.length > 140) state.history.shift();
  }
}

function metrics(state: State, params: Params): MetricValue[] {
  const p = params.mass1 * state.v1 + params.mass2 * state.v2;
  const drift = Math.abs(p - state.p0) / state.pScale;
  const com = (params.mass1 * state.x1 + params.mass2 * state.x2) / (params.mass1 + params.mass2);
  return [
    decorateMetric(
      { id: "momentum", label: "Total momentum", value: p, precision: 4 },
      state.p0,
      Math.max(1e-3, state.pScale * 1e-2)
    ),
    decorateMetric(
      {
        id: "drift",
        label: "Momentum drift (normalized)",
        value: drift,
        precision: 5,
      },
      0,
      1e-2
    ),
    { id: "com", label: "Center of mass", value: com, precision: 3 },
  ];
}

function charts(state: State): ChartSpec[] {
  return [
    {
      id: "momentum",
      title: "Momentum vs time",
      xLabel: "time",
      yLabel: "p",
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
          label: "p reference",
          data: state.history.map((point) => ({ x: point.t, y: state.p0 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "com",
      title: "Center of mass",
      xLabel: "time",
      yLabel: "x_com",
      series: [
        {
          id: "com",
          label: "x_com",
          data: state.history.map((point) => ({ x: point.t, y: point.com })),
          color: "#0284c7",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s02-conservation-of-momentum",
  title: "Isolated Collisions and the Center of Mass",
  summary:
    "Two carts collide in a 1D track. With no external force, total momentum and center-of-mass motion stay constant.",
  archetype: "Collision + COM",
  simulation: {
    fixedDt: 1 / 240,
    maxSubSteps: 20,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "1D point-contact collisions with finite cart radius.",
      "When external force is zero, boundaries are periodic; otherwise reflective.",
      "Restitution coefficient applies only during closing contact.",
    ],
    validRange: [
      "mass1/mass2 in [0.5, 4.0]",
      "v1/v2 in [-1.2, 1.2]",
      "restitution in [0, 1]",
      "external force in [0, 1]",
    ],
    sources: getBenchmarkSources("v1-ch10-s02-conservation-of-momentum"),
    notes:
      "Momentum drift is reported as normalized drift against initial momentum scale.",
  },
  params: [
    {
      id: "mass1",
      label: "mass 1",
      min: 0.5,
      max: 4.0,
      step: 0.1,
      default: 1.0,
    },
    {
      id: "mass2",
      label: "mass 2",
      min: 0.5,
      max: 4.0,
      step: 0.1,
      default: 2.0,
    },
    {
      id: "v1",
      label: "v1 initial",
      min: -1.2,
      max: 1.2,
      step: 0.05,
      default: 0.6,
    },
    {
      id: "v2",
      label: "v2 initial",
      min: -1.2,
      max: 1.2,
      step: 0.05,
      default: -0.2,
    },
    {
      id: "restitution",
      label: "restitution e",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.9,
    },
    {
      id: "externalForce",
      label: "external force on cart 1",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);
    const midY = size.height / 2;
    const mapX = (x: number) =>
      size.width * 0.1 + ((x + 1.1) / 2.2) * size.width * 0.8;

    ctx.strokeStyle = "#cbd5f5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size.width * 0.1, midY);
    ctx.lineTo(size.width * 0.9, midY);
    ctx.stroke();

    const x1 = mapX(state.x1);
    const x2 = mapX(state.x2);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x1 - 16, midY - 12, 32, 24);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(x2 - 16, midY - 12, 32, 24);

    const com =
      (params.mass1 * state.x1 + params.mass2 * state.x2) / (params.mass1 + params.mass2);
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.arc(mapX(com), midY - 24, 5, 0, Math.PI * 2);
    ctx.fill();
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state) => charts(state),
  validate: (state, params) => {
    const p = params.mass1 * state.v1 + params.mass2 * state.v2;
    const driftNorm = Math.abs(p - state.p0) / state.pScale;
    const checks = [
      numericCheck("momentum-drift", "Momentum drift (normalized)", driftNorm, 0, 1e-2),
    ];
    return statusFromChecks(
      checks,
      params.externalForce > 0
        ? ["External force is active; conservation checks are interpreted as forced-response checks."]
        : []
    );
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 320; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state, params);
}
