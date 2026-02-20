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
};

type State = {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  time: number;
  p0: number;
  pScale: number;
  k0: number;
  history: { t: number; kRatio: number }[];
};

const RADIUS = 0.08;
const LEFT = -1.1;
const RIGHT = 1.1;

function buildState(params: Params): State {
  const x1 = -0.7;
  const x2 = 0.7;
  const v1 = params.v1;
  const v2 = params.v2;
  const p0 = params.mass1 * v1 + params.mass2 * v2;
  const pScale = Math.max(1e-6, Math.abs(params.mass1 * v1) + Math.abs(params.mass2 * v2));
  const k0 =
    0.5 * params.mass1 * v1 * v1 + 0.5 * params.mass2 * v2 * v2;
  return { x1, x2, v1, v2, time: 0, p0, pScale, k0, history: [] };
}

function resolveCollision(state: State, params: Params) {
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
  state.x1 += state.v1 * dt;
  state.x2 += state.v2 * dt;
  if (state.x1 - RADIUS < LEFT) {
    state.x1 = LEFT + RADIUS;
    state.v1 *= -1;
  }
  if (state.x2 + RADIUS > RIGHT) {
    state.x2 = RIGHT - RADIUS;
    state.v2 *= -1;
  }
  resolveCollision(state, params);
  state.time += dt;

  if (state.time - (state.history.at(-1)?.t ?? -1) > 0.05) {
    const k =
      0.5 * params.mass1 * state.v1 * state.v1 +
      0.5 * params.mass2 * state.v2 * state.v2;
    state.history.push({
      t: state.time,
      kRatio: state.k0 > 0 ? k / state.k0 : 1,
    });
    if (state.history.length > 140) state.history.shift();
  }
}

function metrics(state: State, params: Params): MetricValue[] {
  const p = params.mass1 * state.v1 + params.mass2 * state.v2;
  const k =
    0.5 * params.mass1 * state.v1 * state.v1 +
    0.5 * params.mass2 * state.v2 * state.v2;
  const window = state.history.slice(-20);
  const kRatioWindow =
    window.length > 0
      ? window.reduce((sum, point) => sum + point.kRatio, 0) / window.length
      : state.k0 > 0
        ? k / state.k0
        : 1;
  return [
    decorateMetric(
      { id: "momentum", label: "Total momentum", value: p, precision: 4 },
      state.p0,
      Math.max(1e-3, state.pScale * 1e-2)
    ),
    decorateMetric({ id: "kRatio", label: "K / K0 (window)", value: kRatioWindow, precision: 4 }, 1, 0.15),
  ];
}

function charts(state: State): ChartSpec[] {
  return [
    {
      id: "energy",
      title: "Energy ratio",
      xLabel: "time",
      yLabel: "K/K0",
      series: [
        {
          id: "ratio",
          label: "K/K0",
          data: state.history.map((point) => ({
            x: point.t,
            y: point.kRatio,
          })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "ratio-ref",
          label: "reference 1",
          data: state.history.map((point) => ({ x: point.t, y: 1 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s04-momentum-and-energy",
  title: "Momentum Conserved, Energy Not Always",
  summary:
    "Two carts collide with adjustable restitution. Momentum stays constant, while kinetic energy can drop.",
  archetype: "Momentum vs Energy",
  simulation: {
    fixedDt: 1 / 240,
    maxSubSteps: 20,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "1D collisions with restitution e and finite cart radius.",
      "Walls are perfectly reflective and do not dissipate energy.",
      "Energy ratio metric uses a trailing observation window.",
    ],
    validRange: [
      "mass1/mass2 in [0.5, 4.0]",
      "v1/v2 in [-1.0, 1.0]",
      "restitution in [0, 1]",
    ],
    sources: getBenchmarkSources("v1-ch10-s04-momentum-and-energy"),
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
      default: 1.5,
    },
    {
      id: "v1",
      label: "v1 initial",
      min: -1.0,
      max: 1.0,
      step: 0.05,
      default: 0.8,
    },
    {
      id: "v2",
      label: "v2 initial",
      min: -1.0,
      max: 1.0,
      step: 0.05,
      default: -0.4,
    },
    {
      id: "restitution",
      label: "restitution e",
      min: 0,
      max: 1,
      step: 0.05,
      default: 0.7,
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

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(mapX(state.x1) - 16, midY - 12, 32, 24);
    ctx.fillStyle = "#f97316";
    ctx.fillRect(mapX(state.x2) - 16, midY - 12, 32, 24);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state) => charts(state),
  validate: (state, params) => {
    const p = params.mass1 * state.v1 + params.mass2 * state.v2;
    const k =
      0.5 * params.mass1 * state.v1 * state.v1 +
      0.5 * params.mass2 * state.v2 * state.v2;
    const kRatio = state.k0 > 0 ? k / state.k0 : 1;
    return statusFromChecks([
      numericCheck(
        "momentum",
        "Total momentum",
        p,
        state.p0,
        Math.max(1e-3, state.pScale * 1e-2)
      ),
      numericCheck(
        "energy-ratio",
        "K/K0",
        kRatio,
        1,
        params.restitution >= 0.95 ? 0.04 : 0.35
      ),
    ]);
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 320; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state, params);
}
