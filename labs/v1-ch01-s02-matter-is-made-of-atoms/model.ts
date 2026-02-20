import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";

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
  tempSamples: number[];
  msdSamples: number[];
};

const SIGMA = 1;
const EPS = 1;
const RCUT = 2.4 * SIGMA;
const RCUT2 = RCUT * RCUT;
const SAMPLE_INTERVAL = 0.05;

function rand(state: State) {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function randNormal(state: State) {
  const u1 = Math.max(1e-6, rand(state));
  const u2 = rand(state);
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

function wrapDelta(delta: number, L: number) {
  if (delta > L / 2) return delta - L;
  if (delta < -L / 2) return delta + L;
  return delta;
}

function wrapCoord(value: number, L: number) {
  if (value < 0) return value + L;
  if (value >= L) return value - L;
  return value;
}

function computeForces(particles: Particle[], L: number) {
  const n = particles.length;
  const fx = new Array(n).fill(0);
  const fy = new Array(n).fill(0);

  for (let i = 0; i < n; i += 1) {
    for (let j = i + 1; j < n; j += 1) {
      const pi = particles[i];
      const pj = particles[j];
      let dx = pj.x - pi.x;
      let dy = pj.y - pi.y;
      dx = wrapDelta(dx, L);
      dy = wrapDelta(dy, L);
      const r2 = dx * dx + dy * dy;
      if (r2 > RCUT2) continue;
      const effectiveR2 = Math.max(r2, 0.18);

      const invR2 = 1 / effectiveR2;
      const invR6 = invR2 * invR2 * invR2;
      const rawForce = 24 * EPS * invR2 * (2 * invR6 * invR6 - invR6);
      const force = Math.max(-120, Math.min(120, rawForce));

      fx[i] += force * dx;
      fy[i] += force * dy;
      fx[j] -= force * dx;
      fy[j] -= force * dy;
    }
  }

  return { fx, fy };
}

function kineticTemperature(state: State) {
  let sum = 0;
  for (const particle of state.particles) {
    sum += particle.mass * (particle.vx * particle.vx + particle.vy * particle.vy);
  }
  return sum / Math.max(1, state.particles.length * 2);
}

function tracerMSD(state: State) {
  const tracer = state.particles[state.tracerIndex];
  const dx = tracer.unwrappedX - state.tracerStartX;
  const dy = tracer.unwrappedY - state.tracerStartY;
  return dx * dx + dy * dy;
}

function meanAndCI95(values: number[]) {
  if (values.length === 0) return { mean: 0, ci: 0 };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + (value - mean) ** 2, 0) /
    Math.max(1, values.length - 1);
  const std = Math.sqrt(Math.max(0, variance));
  const ci = 1.96 * std / Math.sqrt(values.length);
  return { mean, ci };
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
    tempSamples: [],
    msdSamples: [],
  };

  const grid = Math.ceil(Math.sqrt(count));
  let index = 0;
  for (let i = 0; i < grid && index < count; i += 1) {
    for (let j = 0; j < grid && index < count; j += 1) {
      const x = ((i + 0.5) / grid) * L;
      const y = ((j + 0.5) / grid) * L;
      const vx = (rand(state) - 0.5) * 0.2;
      const vy = (rand(state) - 0.5) * 0.2;
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

function stepState(state: State, params: Params, dt: number) {
  const L = state.L;
  const gamma = Math.max(0.01, params.drag);
  const targetT = Math.max(0.02, params.temperature);
  const particles = state.particles;

  const initialForces = computeForces(particles, L);

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    particle.vx += (0.5 * initialForces.fx[i] / particle.mass) * dt;
    particle.vy += (0.5 * initialForces.fy[i] / particle.mass) * dt;

    const prevX = particle.x;
    const prevY = particle.y;
    particle.x = wrapCoord(particle.x + particle.vx * dt, L);
    particle.y = wrapCoord(particle.y + particle.vy * dt, L);

    if (particle.isTracer) {
      let dx = particle.x - prevX;
      let dy = particle.y - prevY;
      dx = wrapDelta(dx, L);
      dy = wrapDelta(dy, L);
      particle.unwrappedX += dx;
      particle.unwrappedY += dy;
      particle.prevX = particle.x;
      particle.prevY = particle.y;
    }
  }

  const updatedForces = computeForces(particles, L);
  const thermostat = Math.exp(-gamma * dt);

  for (let i = 0; i < particles.length; i += 1) {
    const particle = particles[i];
    particle.vx += (0.5 * updatedForces.fx[i] / particle.mass) * dt;
    particle.vy += (0.5 * updatedForces.fy[i] / particle.mass) * dt;

    const sigma = Math.sqrt(
      Math.max(0, (targetT / particle.mass) * (1 - thermostat * thermostat))
    );
    particle.vx = thermostat * particle.vx + sigma * randNormal(state);
    particle.vy = thermostat * particle.vy + sigma * randNormal(state);
    const speed = Math.hypot(particle.vx, particle.vy);
    if (speed > 6) {
      const scale = 6 / speed;
      particle.vx *= scale;
      particle.vy *= scale;
    }
  }

  // Gentle global thermostat correction to keep reduced temperature near target.
  const tempNow = kineticTemperature(state);
  if (Number.isFinite(tempNow) && tempNow > 1e-6) {
    const rescale = Math.sqrt(targetT / tempNow);
    const capped = Math.max(0.85, Math.min(1.15, rescale));
    for (const particle of particles) {
      particle.vx *= capped;
      particle.vy *= capped;
    }
  }

  state.time += dt;
  const tracer = state.particles[state.tracerIndex];
  state.trail.push({ x: tracer.x, y: tracer.y });
  if (state.trail.length > 120) state.trail.shift();

  const previousSampleT = Math.floor((state.time - dt) / SAMPLE_INTERVAL);
  const currentSampleT = Math.floor(state.time / SAMPLE_INTERVAL);
  if (currentSampleT > previousSampleT) {
    state.tempSamples.push(kineticTemperature(state));
    state.msdSamples.push(tracerMSD(state));
    if (state.tempSamples.length > 240) state.tempSamples.shift();
    if (state.msdSamples.length > 240) state.msdSamples.shift();
  }
}

function computePhase(temp: number, density: number) {
  if (temp < 0.25 && density > 0.7) return "solid-like";
  if (temp < 0.9) return "liquid-like";
  return "gas-like";
}

function metrics(state: State, params: Params): MetricValue[] {
  const currentTemp = kineticTemperature(state);
  const currentMSD = tracerMSD(state);
  const tempStats = meanAndCI95(state.tempSamples);
  const msdStats = meanAndCI95(state.msdSamples);
  return [
    decorateMetric(
      { id: "temp", label: "Estimated T", value: currentTemp, precision: 3 },
      params.temperature,
      Math.max(0.2, params.temperature * 0.6)
    ),
    { id: "phase", label: "Phase", value: computePhase(params.temperature, params.density) },
    { id: "msd", label: "Tracer MSD", value: currentMSD, precision: 3 },
    { id: "tempCI", label: "T 95% CI", value: tempStats.ci, precision: 3 },
    { id: "msdCI", label: "MSD 95% CI", value: msdStats.ci, precision: 3 },
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
    x: ((i + 0.5) / bins) * maxSpeed,
    y: count / total,
  }));

  const tempEstimate =
    speeds.reduce((sum, v) => sum + v * v, 0) / Math.max(1, speeds.length) / 2;
  const theoryRaw = data.map((point) => ({
    x: point.x,
    y: point.x * Math.exp(-(point.x * point.x) / Math.max(1e-6, 2 * tempEstimate)),
  }));
  const theoryNorm = theoryRaw.reduce((sum, point) => sum + point.y, 0) || 1;
  const theory = theoryRaw.map((point) => ({ x: point.x, y: point.y / theoryNorm }));

  return [
    {
      id: "speeds",
      title: "Speed distribution",
      xLabel: "speed",
      yLabel: "density",
      series: [
        { id: "hist", label: "sample", data, color: "#0f172a", role: "simulation" },
        {
          id: "theory",
          label: "Maxwell (2D)",
          data: theory,
          color: "#0284c7",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s02-matter-is-made-of-atoms",
  title: "Atoms, Phases, and Brownian Motion",
  summary:
    "A Lennard-Jones particle box with Langevin/Verlet integration shows phase-like regimes and Brownian tracer diffusion with confidence intervals.",
  archetype: "Lennard-Jones Box",
  simulation: {
    fixedDt: 1 / 400,
    maxSubSteps: 24,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "Reduced Lennard-Jones units (sigma = epsilon = 1).",
      "2D periodic box with stochastic Langevin thermostat.",
      "Finite particle count; phase labels are qualitative bins.",
    ],
    validRange: [
      "temperature in [0.1, 2.0]",
      "density in [0.3, 1.2]",
      "drag in [0.01, 1.0]",
    ],
    sources: getBenchmarkSources("v1-ch01-s02-matter-is-made-of-atoms"),
  },
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
  draw: (ctx, state, _params, size) => {
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
  validate: (state, params) => {
    const temp = kineticTemperature(state);
    const msd = tracerMSD(state);
    return statusFromChecks([
      numericCheck(
        "temperature-match",
        "Estimated temperature",
        temp,
        params.temperature,
        Math.max(0.2, params.temperature * 0.6)
      ),
      numericCheck("msd-nonnegative", "MSD >= 0", Math.max(0, msd), msd, 1e-6),
    ]);
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 1400; i += 1) {
    stepState(state, params, 0.002);
  }
  return metrics(state, params);
}
