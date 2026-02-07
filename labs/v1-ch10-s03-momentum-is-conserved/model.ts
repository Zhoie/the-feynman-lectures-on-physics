import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

type Params = {
  mass: number;
  energy: number;
};

type State = {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  baseV1: number;
  baseV2: number;
  release: number;
  latched: boolean;
  time: number;
  history: { t: number; p1: number; p2: number; pTotal: number; k: number }[];
};

const LIMIT = 1.1;
const CART_HALF = 0.12;
const RELEASE_TIME = 0.3;
const ARROW_MAX_WORLD = LIMIT * 0.5;

function buildState(params: Params): State {
  const separation = CART_HALF * 2.2;
  const x1 = -separation / 2;
  const x2 = separation / 2;
  const v = params.energy > 0 ? Math.sqrt(params.energy / params.mass) : 0;
  const release = params.energy > 0 ? 0 : 1;
  return {
    x1,
    x2,
    v1: v * release,
    v2: -v * release,
    baseV1: v,
    baseV2: -v,
    release,
    latched: params.energy <= 0,
    time: 0,
    history: [],
  };
}

function stepState(state: State, params: Params, dt: number) {
  if (!state.latched && state.release < 1) {
    const nextRelease = Math.min(1, state.release + dt / RELEASE_TIME);
    if (nextRelease !== state.release) {
      state.release = nextRelease;
      state.v1 = state.baseV1 * state.release;
      state.v2 = state.baseV2 * state.release;
    }
  }

  if (!state.latched) {
    state.x1 += state.v1 * dt;
    state.x2 += state.v2 * dt;
  }

  if (!state.latched) {
    if (state.x1 - CART_HALF < -LIMIT) {
      state.x1 = -LIMIT + CART_HALF;
      state.v1 *= -1;
    }
    if (state.x2 + CART_HALF > LIMIT) {
      state.x2 = LIMIT - CART_HALF;
      state.v2 *= -1;
    }
  }

  if (!state.latched) {
    const closing = state.v1 > 0 && state.v2 < 0;
    if (state.x2 - state.x1 <= CART_HALF * 2 && closing) {
      const com = (state.x1 + state.x2) / 2;
      state.x1 = com - CART_HALF;
      state.x2 = com + CART_HALF;
      state.v1 = 0;
      state.v2 = 0;
      state.latched = true;
      state.release = 1;
    }
  }

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
    { id: "momentum", label: "Total momentum", value: Math.abs(pTotal), precision: 5 },
    { id: "energy", label: "Kinetic energy", value: k, precision: 4 },
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
        },
        {
          id: "p2",
          label: "p2",
          data: state.history.map((point) => ({ x: point.t, y: point.p2 })),
          color: "#f97316",
        },
        {
          id: "pt",
          label: "p total",
          data: state.history.map((point) => ({ x: point.t, y: point.pTotal })),
          color: "#0284c7",
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
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s03-momentum-is-conserved",
  title: "Equal-Mass Recoil",
  summary:
    "Two equal carts start at rest, then recoil with opposite momentum. They bounce off the walls and return to rest at the center.",
  archetype: "Explosion",
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
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  const v = params.energy > 0 ? Math.sqrt(params.energy / params.mass) : 0;
  const distance = LIMIT - CART_HALF - Math.abs(state.x1);
  const timeToWall = v > 0 ? distance / v : 1;
  const duration = Math.min(RELEASE_TIME + 0.1, timeToWall * 0.8);
  const steps = Math.max(1, Math.floor(duration / 0.02));
  for (let i = 0; i < steps; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state, params);
}
