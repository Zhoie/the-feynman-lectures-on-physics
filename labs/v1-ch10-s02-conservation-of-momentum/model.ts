import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

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
  return { x1, x2, v1, v2, time: 0, p0, history: [] };
}

function collide(state: State, params: Params) {
  const dx = state.x2 - state.x1;
  if (Math.abs(dx) > 2 * RADIUS) return;
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
  const overlap = 2 * RADIUS - Math.abs(dx);
  const shift = overlap / 2;
  state.x1 -= Math.sign(dx) * shift;
  state.x2 += Math.sign(dx) * shift;
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
  const drift = Math.abs(p - state.p0);
  const com = (params.mass1 * state.x1 + params.mass2 * state.x2) / (params.mass1 + params.mass2);
  return [
    { id: "momentum", label: "Total momentum", value: p, precision: 4 },
    { id: "drift", label: "Momentum drift", value: drift, precision: 4 },
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
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 320; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state, params);
}
