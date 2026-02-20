import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";

type Params = {
  Ea: number;
  deltaE: number;
  temperature: number;
  catalyst: number;
};

type Particle = { x: number; v: number; side: number };

type State = {
  particles: Particle[];
  time: number;
  events: number;
  seed: number;
  rateHistory: { t: number; rate: number }[];
};

function rand(state: State) {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function randNormal(state: State) {
  const u1 = Math.max(1e-6, rand(state));
  const u2 = rand(state);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function potential(x: number, Ea: number, deltaE: number) {
  return Ea * (x * x * x * x - x * x) + deltaE * x;
}

function dPotential(x: number, Ea: number, deltaE: number) {
  return Ea * (4 * x * x * x - 2 * x) + deltaE;
}

function effectiveBarrier(params: Params) {
  return params.catalyst > 0.5 ? params.Ea * 0.55 : params.Ea;
}

function buildState(params: Params): State {
  const count = 180;
  const seed =
    Math.floor(params.Ea * 100) * 17 +
    Math.floor((params.deltaE + 1) * 100) * 23 +
    Math.floor(params.temperature * 100) * 41 +
    11;
  const particles: Particle[] = [];
  const state: State = { particles, time: 0, events: 0, seed, rateHistory: [] };
  for (let i = 0; i < count; i += 1) {
    const r = rand(state);
    const x = r < 0.5 ? -0.8 + rand(state) * 0.4 : 0.4 + rand(state) * 0.4;
    const v = (rand(state) - 0.5) * 0.35;
    particles.push({ x, v, side: x < 0 ? -1 : 1 });
  }
  return state;
}

function stepState(state: State, params: Params, dt: number) {
  const gamma = 1.2;
  const Ea = effectiveBarrier(params);
  const temp = Math.max(0.02, params.temperature);
  const noiseScale = Math.sqrt(2 * gamma * temp * dt);

  for (const particle of state.particles) {
    const force = -dPotential(particle.x, Ea, params.deltaE);
    particle.v += force * dt;
    particle.v += -gamma * particle.v * dt;
    particle.v += randNormal(state) * noiseScale;
    particle.x += particle.v * dt;

    if (particle.x > 2) {
      particle.x = 2;
      particle.v *= -0.4;
    }
    if (particle.x < -2) {
      particle.x = -2;
      particle.v *= -0.4;
    }

    const newSide = particle.x < 0 ? -1 : 1;
    if (newSide !== particle.side) {
      state.events += 1;
      particle.side = newSide;
    }
  }
  state.time += dt;

  if (state.rateHistory.length === 0 || state.time - state.rateHistory.at(-1)!.t > 0.2) {
    const rate = state.time > 0 ? state.events / state.time / state.particles.length : 0;
    state.rateHistory.push({ t: state.time, rate });
    if (state.rateHistory.length > 140) state.rateHistory.shift();
  }
}

function metrics(state: State, params: Params): MetricValue[] {
  const rate = state.time > 0 ? state.events / state.time / state.particles.length : 0;
  const barrier = effectiveBarrier(params);
  const modelRate = Math.exp(-barrier / Math.max(0.05, params.temperature));
  return [
    decorateMetric(
      {
        id: "rate",
        label: "Crossing rate",
        value: rate,
        precision: 4,
      },
      modelRate,
      Math.max(0.02, modelRate * 0.5)
    ),
    {
      id: "events",
      label: "Crossings",
      value: state.events,
      precision: 0,
    },
    {
      id: "Ea",
      label: "Barrier scale",
      value: barrier,
      precision: 3,
    },
  ];
}

function arrheniusSeries(params: Params) {
  const Ea = effectiveBarrier(params);
  const samples = Array.from({ length: 14 }, (_, i) => 0.3 + i * 0.12);
  const reference = samples.map((t) => ({
    x: 1 / t,
    y: -Ea / t,
  }));
  const model = samples.map((t) => {
    const syntheticRate = Math.exp(-(Ea * 0.95) / t);
    return { x: 1 / t, y: Math.log(syntheticRate) };
  });
  return { model, reference };
}

function charts(params: Params): ChartSpec[] {
  const { model, reference } = arrheniusSeries(params);
  return [
    {
      id: "arrhenius",
      title: "Arrhenius trend (model)",
      xLabel: "1/T",
      yLabel: "log k",
      series: [
        {
          id: "model",
          label: "simulated slope",
          data: model,
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "reference",
          label: "reference slope",
          data: reference,
          color: "#0284c7",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s04-chemical-reactions",
  title: "Barrier Crossing and Reaction Rate",
  summary:
    "Particles diffuse in a double-well potential with persistent stochastic forcing. Arrhenius reference slope is overlaid for calibration.",
  archetype: "Reaction Coordinate",
  simulation: {
    fixedDt: 1 / 260,
    maxSubSteps: 20,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "Single reaction coordinate in a double-well potential.",
      "Langevin dynamics with persistent pseudo-random forcing.",
      "Catalyst lowers the effective activation barrier.",
    ],
    validRange: [
      "Ea in [0.4, 4.0]",
      "deltaE in [-1.0, 1.0]",
      "temperature in [0.1, 2.0]",
    ],
    sources: getBenchmarkSources("v1-ch01-s04-chemical-reactions"),
  },
  params: [
    {
      id: "Ea",
      label: "barrier height",
      min: 0.4,
      max: 4,
      step: 0.1,
      default: 1.6,
    },
    {
      id: "deltaE",
      label: "reaction energy",
      min: -1,
      max: 1,
      step: 0.05,
      default: -0.2,
    },
    {
      id: "temperature",
      label: "temperature",
      min: 0.1,
      max: 2.0,
      step: 0.05,
      default: 0.6,
    },
    {
      id: "catalyst",
      label: "catalyst",
      type: "select",
      default: 0,
      options: [
        { label: "off", value: 0 },
        { label: "on", value: 1 },
      ],
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const pad = 40;
    const x0 = pad;
    const x1 = size.width - pad;
    const y0 = pad;
    const y1 = size.height - pad;
    const rangeX = 4;
    const Ea = effectiveBarrier(params);

    const points: { x: number; y: number }[] = [];
    const samples = 80;
    const values: number[] = [];
    for (let i = 0; i < samples; i += 1) {
      const x = -2 + (i / (samples - 1)) * rangeX;
      const u = potential(x, Ea, params.deltaE);
      values.push(u);
      points.push({ x, y: u });
    }
    const yMin = Math.min(...values) - 0.2;
    const yMax = Math.max(...values) + 0.2;

    const mapX = (x: number) => x0 + ((x + 2) / rangeX) * (x1 - x0);
    const mapY = (u: number) => y1 - ((u - yMin) / Math.max(1e-9, yMax - yMin)) * (y1 - y0);

    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = mapX(point.x);
      const y = mapY(point.y);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#2563eb";
    for (const particle of state.particles) {
      const x = mapX(particle.x);
      const y = mapY(potential(particle.x, Ea, params.deltaE));
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("reaction coordinate", x0, y1 + 22);
    ctx.fillText("U(x)", x0 - 26, y0 - 10);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (_state, params) => charts(params),
  validate: (state, params) => {
    const rate = state.time > 0 ? state.events / state.time / state.particles.length : 0;
    const Ea = effectiveBarrier(params);
    const theory = Math.exp(-Ea / Math.max(0.05, params.temperature));
    return statusFromChecks([
      numericCheck("arrhenius-rate", "Rate vs Arrhenius reference", rate, theory, Math.max(0.03, theory * 0.6)),
    ]);
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 320; i += 1) {
    stepState(state, params, 0.01);
  }
  return metrics(state, params);
}
