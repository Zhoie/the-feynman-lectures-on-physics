import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

type Params = {
  mass2: number;
  stretch: number;
};

type State = {
  x1: number;
  x2: number;
  v1: number;
  v2: number;
  time: number;
  force12: number;
  force21: number;
  history: { t: number; f12: number; f21: number }[];
};

const MASS1 = 1;
const REST_LENGTH = 1.0;
const SPRING_K = 2.0;

function buildState(params: Params): State {
  const separation = REST_LENGTH + params.stretch;
  return {
    x1: -0.5 * separation,
    x2: 0.5 * separation,
    v1: 0,
    v2: 0,
    time: 0,
    force12: 0,
    force21: 0,
    history: [],
  };
}

function computeForces(state: State) {
  const r = state.x2 - state.x1;
  const force = SPRING_K * (r - REST_LENGTH);
  state.force12 = force;
  state.force21 = -force;
}

function stepState(state: State, params: Params, dt: number) {
  computeForces(state);
  const a1 = state.force12 / MASS1;
  const a2 = state.force21 / params.mass2;
  state.v1 += a1 * dt;
  state.v2 += a2 * dt;
  state.x1 += state.v1 * dt;
  state.x2 += state.v2 * dt;
  state.time += dt;

  if (state.time - (state.history.at(-1)?.t ?? -1) > 0.05) {
    state.history.push({
      t: state.time,
      f12: state.force12,
      f21: state.force21,
    });
    if (state.history.length > 160) state.history.shift();
  }
}

function metrics(state: State): MetricValue[] {
  const forceSum = state.force12 + state.force21;
  return [
    {
      id: "f12",
      label: "Force on cart 1",
      value: state.force12,
      precision: 4,
    },
    {
      id: "f21",
      label: "Force on cart 2",
      value: state.force21,
      precision: 4,
    },
    { id: "forceSum", label: "F12 + F21", value: forceSum, precision: 5 },
  ];
}

function charts(state: State): ChartSpec[] {
  return [
    {
      id: "forces",
      title: "Force pair",
      xLabel: "time",
      yLabel: "force",
      series: [
        {
          id: "f12",
          label: "F12",
          data: state.history.map((point) => ({ x: point.t, y: point.f12 })),
          color: "#0f172a",
        },
        {
          id: "f21",
          label: "F21",
          data: state.history.map((point) => ({ x: point.t, y: point.f21 })),
          color: "#0ea5e9",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s01-newton-s-third-law",
  title: "Action and Reaction",
  summary:
    "Two carts are linked by a spring. Cart 1 stays at 1 unit mass; the force sensors always show equal and opposite forces.",
  archetype: "Action-Reaction Pair",
  params: [
    {
      id: "mass2",
      label: "cart 2 mass",
      min: 0.5,
      max: 4,
      step: 0.1,
      default: 1.5,
    },
    {
      id: "stretch",
      label: "initial spring stretch",
      min: 0.05,
      max: 0.6,
      step: 0.05,
      default: 0.25,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, _params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const midY = size.height / 2;
    const range = 2.4;
    const mapX = (x: number) =>
      size.width * 0.1 + ((x + range / 2) / range) * size.width * 0.8;

    ctx.strokeStyle = "#cbd5f5";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size.width * 0.1, midY);
    ctx.lineTo(size.width * 0.9, midY);
    ctx.stroke();

    const x1 = mapX(state.x1);
    const x2 = mapX(state.x2);

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, midY);
    ctx.lineTo(x2, midY);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.arc(x1, midY, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(x2, midY, 12, 0, Math.PI * 2);
    ctx.fill();

    const arrowScale = 28;
    ctx.strokeStyle = "#2563eb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x1, midY - 18);
    ctx.lineTo(x1 + state.force12 * arrowScale, midY - 18);
    ctx.stroke();

    ctx.strokeStyle = "#0d9488";
    ctx.beginPath();
    ctx.moveTo(x2, midY + 18);
    ctx.lineTo(x2 + state.force21 * arrowScale, midY + 18);
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("F12", x1 + state.force12 * arrowScale, midY - 22);
    ctx.fillText("F21", x2 + state.force21 * arrowScale, midY + 32);
  },
  metrics: (state) => metrics(state),
  charts: (state) => charts(state),
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 300; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state);
}
