import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

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
};

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function potential(x: number, Ea: number, deltaE: number) {
  return Ea * (x * x * x * x - x * x) + deltaE * x;
}

function dPotential(x: number, Ea: number, deltaE: number) {
  return Ea * (4 * x * x * x - 2 * x) + deltaE;
}

function buildState(params: Params): State {
  const count = 160;
  const seed =
    Math.floor(params.Ea * 100) * 17 +
    Math.floor((params.deltaE + 1) * 100) * 23 +
    Math.floor(params.temperature * 100) * 41 +
    11;
  const rand = mulberry32(seed);
  const particles: Particle[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = rand() < 0.5 ? -0.8 + rand() * 0.4 : 0.4 + rand() * 0.4;
    const v = (rand() - 0.5) * 0.4;
    particles.push({ x, v, side: x < 0 ? -1 : 1 });
  }
  return { particles, time: 0, events: 0 };
}

function stepState(state: State, params: Params, dt: number) {
  const gamma = 1.2;
  const effectiveEa = params.catalyst > 0.5 ? params.Ea * 0.55 : params.Ea;
  const temp = Math.max(0.02, params.temperature);
  const noiseScale = Math.sqrt(2 * gamma * temp * dt);
  const rand = mulberry32(
    Math.floor(state.time * 1000) + Math.floor(temp * 100)
  );

  for (const particle of state.particles) {
    const force = -dPotential(particle.x, effectiveEa, params.deltaE);
    particle.v += force * dt;
    particle.v += -gamma * particle.v * dt;
    particle.v += (rand() - 0.5) * 2 * noiseScale;
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
}

function metrics(state: State, params: Params): MetricValue[] {
  const rate = state.time > 0 ? state.events / state.time / state.particles.length : 0;
  return [
    {
      id: "rate",
      label: "Crossing rate",
      value: rate,
      precision: 4,
    },
    {
      id: "events",
      label: "Crossings",
      value: state.events,
      precision: 0,
    },
    {
      id: "Ea",
      label: "Barrier scale",
      value: params.catalyst > 0.5 ? params.Ea * 0.55 : params.Ea,
      precision: 3,
    },
  ];
}

function charts(params: Params): ChartSpec[] {
  const effectiveEa = params.catalyst > 0.5 ? params.Ea * 0.55 : params.Ea;
  const samples = Array.from({ length: 12 }, (_, i) => 0.3 + i * 0.15);
  return [
    {
      id: "arrhenius",
      title: "Arrhenius trend (model)",
      xLabel: "1/T",
      yLabel: "log k",
      series: [
        {
          id: "model",
          label: "exp(-Ea/T)",
          data: samples.map((t) => ({
            x: 1 / t,
            y: Math.log(Math.exp(-effectiveEa / t)),
          })),
          color: "#0f172a",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s04-chemical-reactions",
  title: "Barrier Crossing and Reaction Rate",
  summary:
    "Particles diffuse in a double-well potential. Raising temperature or lowering the barrier increases the crossing rate.",
  archetype: "Reaction Coordinate",
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
    const effectiveEa = params.catalyst > 0.5 ? params.Ea * 0.55 : params.Ea;

    const points: { x: number; y: number }[] = [];
    const samples = 80;
    const values: number[] = [];
    for (let i = 0; i < samples; i += 1) {
      const x = -2 + (i / (samples - 1)) * rangeX;
      const u = potential(x, effectiveEa, params.deltaE);
      values.push(u);
      points.push({ x, y: u });
    }
    const yMin = Math.min(...values) - 0.2;
    const yMax = Math.max(...values) + 0.2;

    const mapX = (x: number) => x0 + ((x + 2) / rangeX) * (x1 - x0);
    const mapY = (u: number) => y1 - ((u - yMin) / (yMax - yMin)) * (y1 - y0);

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
      const y = mapY(potential(particle.x, effectiveEa, params.deltaE));
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
  charts: (state, params) => charts(params),
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 240; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state, params);
}
