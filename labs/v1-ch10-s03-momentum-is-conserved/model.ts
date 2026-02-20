import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";

type Params = {
  mass: number;
  energy: number;
};

type State = {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  time: number;
  p0: number;
  k0: number;
  history: { t: number; p1: number; p2: number; pTotal: number; k: number }[];
};

const LIMIT = 1.1;
const CART_HALF = 0.12;
const ARROW_MAX_WORLD = LIMIT * 0.5;

function buildState(params: Params): State {
  const separation = CART_HALF * 2.4;
  const x1 = -separation / 2;
  const x2 = separation / 2;
  const v = params.energy > 0 ? Math.sqrt(params.energy / params.mass) : 0;
  const v1 = v;
  const v2 = -v;
  const p0 = params.mass * v1 + params.mass * v2;
  const k0 = 0.5 * params.mass * (v1 * v1 + v2 * v2);
  return {
    x1,
    x2,
    v1,
    v2,
    time: 0,
    p0,
    k0,
    history: [],
  };
}

function resolveCollision(state: State) {
  const dx = state.x2 - state.x1;
  const overlap = CART_HALF * 2 - Math.abs(dx);
  if (overlap <= 0) return;
  const relV = state.v2 - state.v1;
  const closing = dx * relV < 0;
  const sign = dx === 0 ? 1 : Math.sign(dx);
  const shift = overlap / 2;
  state.x1 -= sign * shift;
  state.x2 += sign * shift;
  if (!closing) return;

  // Equal masses: elastic collision swaps velocities.
  const v1 = state.v1;
  state.v1 = state.v2;
  state.v2 = v1;
}

function stepState(state: State, params: Params, dt: number) {
  state.x1 += state.v1 * dt;
  state.x2 += state.v2 * dt;

  if (state.x1 - CART_HALF < -LIMIT) {
    state.x1 = -LIMIT + CART_HALF;
    state.v1 *= -1;
  }
  if (state.x2 + CART_HALF > LIMIT) {
    state.x2 = LIMIT - CART_HALF;
    state.v2 *= -1;
  }

  resolveCollision(state);

  state.time += dt;
  if (state.time - (state.history.at(-1)?.t ?? -1) > 0.05) {
    const p1 = params.mass * state.v1;
    const p2 = params.mass * state.v2;
    const pTotal = p1 + p2;
    const k = 0.5 * params.mass * (state.v1 * state.v1 + state.v2 * state.v2);
    state.history.push({ t: state.time, p1, p2, pTotal, k });
    if (state.history.length > 160) state.history.shift();
  }
}

function metrics(state: State, params: Params): MetricValue[] {
  const p1 = params.mass * state.v1;
  const p2 = params.mass * state.v2;
  const pTotal = p1 + p2;
  const k = 0.5 * params.mass * (state.v1 * state.v1 + state.v2 * state.v2);
  return [
    { id: "p1", label: "Momentum p1", value: p1, precision: 4 },
    { id: "p2", label: "Momentum p2", value: p2, precision: 4 },
    decorateMetric(
      { id: "momentum", label: "Total momentum", value: Math.abs(pTotal), precision: 6 },
      0,
      1e-5
    ),
    decorateMetric(
      { id: "energy", label: "Kinetic energy", value: k, precision: 4 },
      state.k0,
      Math.max(1e-3, state.k0 * 0.02)
    ),
  ];
}

function charts(state: State): ChartSpec[] {
  return [
    {
      id: "p",
      title: "Momentum along axis",
      xLabel: "time",
      yLabel: "p",
      series: [
        {
          id: "p1",
          label: "p1",
          data: state.history.map((point) => ({ x: point.t, y: point.p1 })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "p2",
          label: "p2",
          data: state.history.map((point) => ({ x: point.t, y: point.p2 })),
          color: "#f97316",
          role: "simulation",
        },
        {
          id: "pt",
          label: "p total",
          data: state.history.map((point) => ({ x: point.t, y: point.pTotal })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "pt-ref",
          label: "reference 0",
          data: state.history.map((point) => ({ x: point.t, y: state.p0 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "k",
      title: "Kinetic energy",
      xLabel: "time",
      yLabel: "K",
      series: [
        {
          id: "k",
          label: "K",
          data: state.history.map((point) => ({ x: point.t, y: point.k })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "k-ref",
          label: "K reference",
          data: state.history.map((point) => ({ x: point.t, y: state.k0 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s03-momentum-is-conserved",
  title: "Equal-Mass Recoil",
  summary:
    "Two equal carts recoil with opposite momentum. With elastic walls and equal masses, total momentum stays near zero and kinetic energy stays bounded.",
  archetype: "Explosion",
  simulation: {
    fixedDt: 1 / 240,
    maxSubSteps: 20,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "Two equal masses in 1D with elastic wall reflections.",
      "No drag or rolling friction losses.",
      "Cart-cart collision is modeled as perfectly elastic for equal masses.",
    ],
    validRange: ["cart mass in [0.5, 4.0]", "release energy in [0, 2.0]"],
    sources: getBenchmarkSources("v1-ch10-s03-momentum-is-conserved"),
    notes:
      "This model removes the non-physical stick-and-stop behavior and keeps recoil dynamics conservative.",
  },
  params: [
    {
      id: "mass",
      label: "cart mass",
      min: 0.5,
      max: 4,
      step: 0.1,
      default: 1.0,
    },
    {
      id: "energy",
      label: "release energy",
      min: 0,
      max: 2.0,
      step: 0.05,
      default: 1.0,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const midY = size.height / 2;
    const trackLeft = size.width * 0.1;
    const trackRight = size.width * 0.9;
    const trackWidth = trackRight - trackLeft;
    const mapX = (x: number) =>
      trackLeft + ((x + LIMIT) / (LIMIT * 2)) * trackWidth;
    const worldToPx = (world: number) => (world / (LIMIT * 2)) * trackWidth;

    const cartWidth = worldToPx(CART_HALF * 2);
    const cartHeight = 26;
    const wallWidth = 12;
    const wallHeight = 48;

    ctx.strokeStyle = "#cbd5f5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(trackLeft, midY);
    ctx.lineTo(trackRight, midY);
    ctx.stroke();

    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(trackLeft - wallWidth, midY - wallHeight / 2, wallWidth, wallHeight);
    ctx.fillRect(trackRight, midY - wallHeight / 2, wallWidth, wallHeight);

    const com = (state.x1 + state.x2) / 2;
    const comX = mapX(com);
    const comY = midY;

    const p1 = params.mass * state.v1;
    const p2 = params.mass * state.v2;
    const pTotal = p1 + p2;
    const pMax = Math.max(Math.abs(p1), Math.abs(p2), 1e-6);

    const drawArrow = (
      xWorld: number,
      y: number,
      dir: number,
      lengthWorld: number,
      color: string
    ) => {
      if (lengthWorld <= 1e-6) return;
      const lengthPx = worldToPx(lengthWorld);
      const startX = mapX(xWorld);
      const endX = startX + dir * lengthPx;
      const head = Math.max(8, lengthPx * 0.2);
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(endX, y);
      ctx.lineTo(endX - dir * head, y - head * 0.5);
      ctx.lineTo(endX - dir * head, y + head * 0.5);
      ctx.closePath();
      ctx.fill();
    };

    drawArrow(
      state.x1,
      midY - 32,
      Math.sign(p1) || 1,
      (Math.abs(p1) / pMax) * ARROW_MAX_WORLD,
      "#0f172a"
    );
    drawArrow(
      state.x2,
      midY + 32,
      Math.sign(p2) || 1,
      (Math.abs(p2) / pMax) * ARROW_MAX_WORLD,
      "#f97316"
    );
    drawArrow(
      com,
      midY - 52,
      Math.sign(pTotal) || 1,
      (Math.abs(pTotal) / pMax) * ARROW_MAX_WORLD,
      "#64748b"
    );

    const x1 = mapX(state.x1) - cartWidth / 2;
    const x2 = mapX(state.x2) - cartWidth / 2;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(x1, midY - cartHeight / 2, cartWidth, cartHeight);

    ctx.fillStyle = "#f97316";
    ctx.fillRect(x2, midY - cartHeight / 2, cartWidth, cartHeight);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(comX - 6, comY);
    ctx.lineTo(comX + 6, comY);
    ctx.moveTo(comX, comY - 6);
    ctx.lineTo(comX, comY + 6);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("p_total ≈ 0", size.width / 2 - 40, midY - 72);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state) => charts(state),
  validate: (state, params) => {
    const pTotal = params.mass * state.v1 + params.mass * state.v2;
    const k = 0.5 * params.mass * (state.v1 * state.v1 + state.v2 * state.v2);
    return statusFromChecks([
      numericCheck("momentum-total", "|p_total|", Math.abs(pTotal), 0, 1e-5),
      numericCheck("energy-conservation", "Kinetic energy", k, state.k0, Math.max(1e-3, state.k0 * 0.02)),
    ]);
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  if (params.energy <= 0) {
    return metrics(state, params);
  }
  const v = Math.sqrt(params.energy / params.mass);
  const distance = LIMIT - CART_HALF - Math.abs(state.x1);
  const timeToWall = v > 0 ? distance / v : 1;
  const duration = Math.max(0.2, Math.min(0.45, timeToWall * 0.8));
  const steps = Math.max(1, Math.floor(duration / 0.005));
  for (let i = 0; i < steps; i += 1) {
    stepState(state, params, 0.005);
  }
  return metrics(state, params);
}
