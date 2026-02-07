import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

type Params = {
  temperature: number;
  density: number;
  drag: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  mass: number;
  isTracer: boolean;
  unwrappedX: number;
  unwrappedY: number;
  prevX: number;
  prevY: number;
};

type State = {
  particles: Particle[];
  L: number;
  time: number;
  seed: number;
  tracerIndex: number;
  tracerStartX: number;
  tracerStartY: number;
  trail: { x: number; y: number }[];
};

const SIGMA = 1;
const EPS = 1;
const RCUT = 2.4 * SIGMA;
const RCUT2 = RCUT * RCUT;

function rand(state: State) {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function randNormal(state: State) {
  const u1 = Math.max(1e-6, rand(state));
  const u2 = rand(state);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function buildState(params: Params): State {
  const count = 120;
  const density = Math.max(0.2, params.density);
  const L = Math.sqrt(count / density);
  const particles: Particle[] = [];
  const seed =
    Math.floor(params.temperature * 1000) * 17 +
    Math.floor(params.density * 100) * 31 +
    101;
  const state: State = {
    particles,
    L,
    time: 0,
    seed,
    tracerIndex: 0,
    tracerStartX: 0,
    tracerStartY: 0,
    trail: [],
  };

  const grid = Math.ceil(Math.sqrt(count));
  let index = 0;
  for (let i = 0; i < grid && index < count; i += 1) {
    for (let j = 0; j < grid && index < count; j += 1) {
      const x = ((i + 0.5) / grid) * L;
      const y = ((j + 0.5) / grid) * L;
      const vx = (rand(state) - 0.5) * 0.4;
      const vy = (rand(state) - 0.5) * 0.4;
      particles.push({
        x,
        y,
        vx,
        vy,
        mass: 1,
        isTracer: false,
        unwrappedX: x,
        unwrappedY: y,
        prevX: x,
        prevY: y,
      });
      index += 1;
    }
  }

  const tracer = particles[0];
  tracer.mass = 6;
  tracer.isTracer = true;
  state.tracerIndex = 0;
  state.tracerStartX = tracer.unwrappedX;
  state.tracerStartY = tracer.unwrappedY;
  return state;
}

function wrap(delta: number, L: number) {
  if (delta > L / 2) return delta - L;
  if (delta < -L / 2) return delta + L;
  return delta;
}

function stepState(state: State, params: Params, dt: number) {
  const gamma = params.drag;
  const temp = Math.max(0.02, params.temperature);
  const L = state.L;
  const n = state.particles.length;
  const fx = new Array(n).fill(0);
  const fy = new Array(n).fill(0);

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const pi = state.particles[i];
      const pj = state.particles[j];
      let dx = pj.x - pi.x;
      let dy = pj.y - pi.y;
      dx = wrap(dx, L);
      dy = wrap(dy, L);
      const r2 = dx * dx + dy * dy;
      if (r2 < 1e-6 || r2 > RCUT2) continue;
      const invR2 = 1 / r2;
      const invR6 = invR2 * invR2 * invR2;
      const force = 24 * EPS * invR2 * (2 * invR6 * invR6 - invR6);
      fx[i] += force * dx;
      fy[i] += force * dy;
      fx[j] -= force * dx;
      fy[j] -= force * dy;
    }
  }

  const noiseScale = Math.sqrt(2 * gamma * temp * dt);

  for (let i = 0; i < n; i += 1) {
    const particle = state.particles[i];
    particle.vx += (fx[i] / particle.mass) * dt;
    particle.vy += (fy[i] / particle.mass) * dt;
    particle.vx += -gamma * particle.vx * dt + noiseScale * randNormal(state);
    particle.vy += -gamma * particle.vy * dt + noiseScale * randNormal(state);

    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    if (particle.x < 0) particle.x += L;
    if (particle.x > L) particle.x -= L;
    if (particle.y < 0) particle.y += L;
    if (particle.y > L) particle.y -= L;

    if (particle.isTracer) {
      let dx = particle.x - particle.prevX;
      let dy = particle.y - particle.prevY;
      dx = wrap(dx, L);
      dy = wrap(dy, L);
      particle.unwrappedX += dx;
      particle.unwrappedY += dy;
      particle.prevX = particle.x;
      particle.prevY = particle.y;
    }
  }

  state.time += dt;
  const tracer = state.particles[state.tracerIndex];
  state.trail.push({ x: tracer.x, y: tracer.y });
  if (state.trail.length > 80) state.trail.shift();
}

function computePhase(temp: number, density: number) {
  if (temp < 0.25 && density > 0.7) return "solid-like";
  if (temp < 0.9) return "liquid-like";
  return "gas-like";
}

function metrics(state: State, params: Params): MetricValue[] {
  let sum = 0;
  for (const particle of state.particles) {
    sum += particle.vx * particle.vx + particle.vy * particle.vy;
  }
  const temp = sum / state.particles.length / 2;
  const tracer = state.particles[state.tracerIndex];
  const dx = tracer.unwrappedX - state.tracerStartX;
  const dy = tracer.unwrappedY - state.tracerStartY;
  const msd = dx * dx + dy * dy;
  return [
    { id: "temp", label: "Estimated T", value: temp, precision: 3 },
    {
      id: "phase",
      label: "Phase",
      value: computePhase(params.temperature, params.density),
    },
    { id: "msd", label: "Tracer MSD", value: msd, precision: 3 },
  ];
}

function charts(state: State): ChartSpec[] {
  const speeds = state.particles
    .filter((p) => !p.isTracer)
    .map((p) => Math.sqrt(p.vx * p.vx + p.vy * p.vy));
  const maxSpeed = Math.max(...speeds, 1);
  const bins = 20;
  const hist = new Array(bins).fill(0);
  speeds.forEach((speed) => {
    const idx = Math.min(bins - 1, Math.floor((speed / maxSpeed) * bins));
    hist[idx] += 1;
  });
  const total = speeds.length || 1;
  const data = hist.map((count, i) => ({
    x: (i / bins) * maxSpeed,
    y: count / total,
  }));

  const tempEstimate =
    speeds.reduce((sum, v) => sum + v * v, 0) / (speeds.length || 1) / 2;
  const theory = data.map((point) => ({
    x: point.x,
    y: point.x * Math.exp(-(point.x * point.x) / (2 * tempEstimate)),
  }));

  return [
    {
      id: "speeds",
      title: "Speed distribution",
      xLabel: "speed",
      yLabel: "density",
      series: [
        { id: "hist", label: "sample", data, color: "#0f172a" },
        { id: "theory", label: "Maxwell (2D)", data: theory, color: "#0284c7" },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s02-matter-is-made-of-atoms",
  title: "Atoms, Phases, and Brownian Motion",
  summary:
    "A Lennard-Jones style particle box shows solid, liquid, and gas behavior. A heavy tracer jitters with Brownian motion.",
  archetype: "Lennard-Jones Box",
  params: [
    {
      id: "temperature",
      label: "temperature",
      min: 0.1,
      max: 2.0,
      step: 0.05,
      default: 0.6,
    },
    {
      id: "density",
      label: "density",
      min: 0.3,
      max: 1.2,
      step: 0.05,
      default: 0.8,
    },
    {
      id: "drag",
      label: "drag",
      min: 0.01,
      max: 1.0,
      step: 0.01,
      default: 0.1,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const pad = 18;
    const boxSize = Math.min(size.width, size.height) - pad * 2;
    const offsetX = (size.width - boxSize) / 2;
    const offsetY = (size.height - boxSize) / 2;
    const scale = boxSize / state.L;

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, boxSize, boxSize);

    ctx.strokeStyle = "rgba(37, 99, 235, 0.3)";
    ctx.beginPath();
    state.trail.forEach((point, index) => {
      const x = offsetX + point.x * scale;
      const y = offsetY + point.y * scale;
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    for (const particle of state.particles) {
      const x = offsetX + particle.x * scale;
      const y = offsetY + particle.y * scale;
      ctx.beginPath();
      ctx.fillStyle = particle.isTracer ? "#f97316" : "#0f172a";
      ctx.arc(x, y, particle.isTracer ? 4.5 : 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("periodic box", offsetX, offsetY - 8);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state) => charts(state),
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 240; i += 1) {
    stepState(state, params, 0.01);
  }
  return metrics(state, params);
}
