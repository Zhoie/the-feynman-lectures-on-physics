import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

type Params = {
  mass: number;
  vMax: number;
  vProbe: number;
};

type State = {
  points: { v: number; pc: number; pr: number; err: number }[];
};

const C = 1;

function gamma(v: number) {
  const beta = v / C;
  return 1 / Math.sqrt(1 - beta * beta);
}

function buildState(params: Params): State {
  const steps = 60;
  const vmax = Math.max(0.05, Math.min(0.99, params.vMax));
  const points: { v: number; pc: number; pr: number; err: number }[] = [];
  for (let i = 0; i < steps; i += 1) {
    const v = (i / (steps - 1)) * vmax;
    const pc = params.mass * v;
    const pr = gamma(v) * params.mass * v;
    const err = pr > 0 ? Math.abs(pr - pc) / pr : 0;
    points.push({ v, pc, pr, err });
  }
  return { points };
}

function metrics(state: State, params: Params): MetricValue[] {
  const v = Math.min(params.vProbe, params.vMax);
  const pc = params.mass * v;
  const pr = gamma(v) * params.mass * v;
  const err = pr > 0 ? Math.abs(pr - pc) / pr : 0;
  return [
    { id: "pc", label: "p classical", value: pc, precision: 4 },
    { id: "pr", label: "p relativistic", value: pr, precision: 4 },
    { id: "err", label: "relative error", value: err, precision: 4 },
  ];
}

function charts(state: State): ChartSpec[] {
  return [
    {
      id: "momentum",
      title: "Momentum vs velocity",
      xLabel: "v/c",
      yLabel: "p",
      series: [
        {
          id: "classic",
          label: "p = mv",
          data: state.points.map((point) => ({ x: point.v, y: point.pc })),
          color: "#0f172a",
        },
        {
          id: "rel",
          label: "p = gamma mv",
          data: state.points.map((point) => ({ x: point.v, y: point.pr })),
          color: "#0284c7",
        },
      ],
    },
    {
      id: "error",
      title: "Relative error",
      xLabel: "v/c",
      yLabel: "error",
      series: [
        {
          id: "err",
          label: "error",
          data: state.points.map((point) => ({ x: point.v, y: point.err })),
          color: "#f97316",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s05-relativistic-momentum",
  title: "Classical vs Relativistic Momentum",
  summary:
    "Compare p = mv with p = gamma mv. At low speed they match, but the classical formula fails at high speed.",
  archetype: "Relativistic Momentum",
  params: [
    {
      id: "mass",
      label: "mass",
      min: 0.5,
      max: 4.0,
      step: 0.1,
      default: 1.0,
    },
    {
      id: "vMax",
      label: "v max (c = 1)",
      min: 0.1,
      max: 0.99,
      step: 0.01,
      default: 0.9,
    },
    {
      id: "vProbe",
      label: "probe velocity",
      min: 0.01,
      max: 0.99,
      step: 0.01,
      default: 0.4,
    },
  ],
  create: (params) => buildState(params),
  step: () => {},
  draw: (ctx, state, params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const pad = 40;
    const x0 = pad;
    const x1 = size.width - pad;
    const y0 = pad;
    const y1 = size.height - pad;
    const vmax = Math.max(0.1, params.vMax);
    const pMax = Math.max(...state.points.map((point) => point.pr), 1);
    const mapX = (v: number) => x0 + (v / vmax) * (x1 - x0);
    const mapY = (p: number) => y1 - (p / pMax) * (y1 - y0);

    ctx.strokeStyle = "#cbd5f5";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x0, y1);
    ctx.lineTo(x1, y1);
    ctx.stroke();

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    state.points.forEach((point, index) => {
      const x = mapX(point.v);
      const y = mapY(point.pc);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.strokeStyle = "#0284c7";
    ctx.beginPath();
    state.points.forEach((point, index) => {
      const x = mapX(point.v);
      const y = mapY(point.pr);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    const probe = Math.min(params.vProbe, vmax);
    const pc = params.mass * probe;
    const pr = gamma(probe) * params.mass * probe;
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(mapX(probe), mapY(pr), 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("v/c", x1 - 20, y1 + 20);
    ctx.fillText("p", x0 - 18, y0 - 10);
    ctx.fillText(`probe v=${probe.toFixed(2)}`, x0, y0 - 24);
    ctx.fillText(`p_rel=${pr.toFixed(2)} p_class=${pc.toFixed(2)}`, x0, y0 - 8);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state) => charts(state),
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  return metrics(state, params);
}
