import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";

type Params = {
  temperature: number;
  humidity: number;
  saltConcentration: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: "liquid" | "gas";
};

type State = {
  particles: Particle[];
  time: number;
  evapCount: number;
  condCount: number;
  history: { t: number; evap: number; cond: number }[];
  salt: boolean[][];
  dissolved: number;
  totalSaltSites: number;
  seed: number;
};

function rand(state: State) {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function buildState(params: Params): State {
  const count = 160;
  const gasCount = Math.floor(count * Math.max(0, Math.min(0.95, params.humidity)));
  const particles: Particle[] = [];
  let seed =
    Math.floor(params.temperature * 100) * 17 +
    Math.floor(params.humidity * 100) * 29 +
    99;
  const randLocal = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  for (let i = 0; i < count; i += 1) {
    const isGas = i < gasCount;
    const x = randLocal() * 2 - 1;
    const y = isGas ? randLocal() * 1 : -randLocal();
    particles.push({
      x,
      y,
      vx: (randLocal() - 0.5) * 0.3,
      vy: (randLocal() - 0.5) * 0.3,
      phase: isGas ? "gas" : "liquid",
    });
  }

  const saltSize = 10;
  const salt: boolean[][] = Array.from({ length: saltSize }, () =>
    Array.from({ length: saltSize }, () => true)
  );

  return {
    particles,
    time: 0,
    evapCount: 0,
    condCount: 0,
    history: [],
    salt,
    dissolved: 0,
    totalSaltSites: saltSize * saltSize,
    seed,
  };
}

function exposedSaltSites(state: State): [number, number][] {
  const size = state.salt.length;
  const exposed: [number, number][] = [];
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      if (!state.salt[i][j]) continue;
      const neighbors: [number, number][] = [
        [i - 1, j],
        [i + 1, j],
        [i, j - 1],
        [i, j + 1],
      ];
      const boundary = i === 0 || j === 0 || i === size - 1 || j === size - 1;
      const nearVoid = neighbors.some(([ni, nj]) => {
        if (ni < 0 || nj < 0 || ni >= size || nj >= size) return true;
        return !state.salt[ni][nj];
      });
      if (boundary || nearVoid) exposed.push([i, j]);
    }
  }
  return exposed;
}

function stepSalt(state: State, params: Params, dt: number) {
  const temp = Math.max(0.05, params.temperature);
  const concentrationFactor = Math.max(0.05, 1 - params.saltConcentration);
  const exposed = exposedSaltSites(state);
  const kDiss = 0.12 * temp * concentrationFactor;
  const p = 1 - Math.exp(-kDiss * dt);
  for (const [i, j] of exposed) {
    if (!state.salt[i][j]) continue;
    if (rand(state) < p) {
      state.salt[i][j] = false;
      state.dissolved += 1;
    }
  }
}

function stepState(state: State, params: Params, dt: number) {
  const temp = Math.max(0.05, params.temperature);
  const humidity = Math.max(0.01, Math.min(0.95, params.humidity));
  const kEvap = 0.7 * temp * Math.max(0.05, 1 - humidity);
  const kCond = 0.55 * (0.2 + humidity) * (1 + 0.3 / (temp + 0.2));

  let evapEvents = 0;
  let condEvents = 0;

  for (const particle of state.particles) {
    const liquidDamp = 2.0;
    const gasDamp = 0.25;
    const damp = particle.phase === "liquid" ? liquidDamp : gasDamp;
    const noise = 0.35 * temp;
    particle.vx += -damp * particle.vx * dt + (rand(state) - 0.5) * noise;
    particle.vy += -damp * particle.vy * dt + (rand(state) - 0.5) * noise;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    if (particle.x < -1) particle.x += 2;
    if (particle.x > 1) particle.x -= 2;
    if (particle.y > 1) {
      particle.y = 1;
      particle.vy *= -0.35;
    }
    if (particle.y < -1) {
      particle.y = -1;
      particle.vy *= -0.35;
    }

    if (particle.phase === "liquid") {
      const pEvap = 1 - Math.exp(-kEvap * dt);
      if (rand(state) < pEvap) {
        particle.phase = "gas";
        particle.y = Math.max(0.02, particle.y);
        evapEvents += 1;
      } else if (particle.y > 0) {
        particle.y = -Math.abs(particle.y);
      }
    } else {
      const pCond = 1 - Math.exp(-kCond * dt);
      if (rand(state) < pCond && particle.y < 0.3) {
        particle.phase = "liquid";
        particle.y = -Math.abs(particle.y);
        condEvents += 1;
      }
    }
  }

  state.evapCount += evapEvents;
  state.condCount += condEvents;
  state.time += dt;

  if (state.history.length === 0 || state.time - state.history.at(-1)!.t > 0.2) {
    state.history.push({
      t: state.time,
      evap: evapEvents / Math.max(dt, 1e-6),
      cond: condEvents / Math.max(dt, 1e-6),
    });
    if (state.history.length > 120) state.history.shift();
  }

  stepSalt(state, params, dt);
}

function conservationError(state: State) {
  const remaining = state.salt.reduce(
    (sum, row) => sum + row.filter(Boolean).length,
    0
  );
  const ionError = Math.abs(remaining + state.dissolved - state.totalSaltSites);
  const phaseError = Math.abs(
    state.particles.filter((p) => p.phase === "gas").length +
      state.particles.filter((p) => p.phase === "liquid").length -
      state.particles.length
  );
  return ionError + phaseError;
}

function metrics(state: State): MetricValue[] {
  const rate = state.time > 0 ? state.evapCount / state.time : 0;
  const cond = state.time > 0 ? state.condCount / state.time : 0;
  const err = conservationError(state);
  return [
    decorateMetric(
      { id: "evap", label: "Evaporation rate", value: rate, precision: 3 },
      cond,
      Math.max(0.5, 0.4 * Math.max(rate, cond))
    ),
    { id: "cond", label: "Condensation rate", value: cond, precision: 3 },
    { id: "salt", label: "Ions dissolved", value: state.dissolved, precision: 0 },
    decorateMetric(
      { id: "cons", label: "Conservation error", value: err, precision: 3 },
      0,
      1e-6
    ),
  ];
}

function charts(state: State): ChartSpec[] {
  return [
    {
      id: "flux",
      title: "Flux over time",
      xLabel: "time",
      yLabel: "events/sec",
      series: [
        {
          id: "evap",
          label: "evaporation",
          data: state.history.map((point) => ({ x: point.t, y: point.evap })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "cond",
          label: "condensation",
          data: state.history.map((point) => ({ x: point.t, y: point.cond })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "eq",
          label: "equilibrium",
          data: state.history.map((point) => ({ x: point.t, y: (point.evap + point.cond) * 0.5 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s03-atomic-processes",
  title: "Evaporation, Condensation, and Dissolution",
  summary:
    "Phase exchange and dissolution are driven by rate equations, while particles provide a visual microstate realization.",
  archetype: "Phase Exchange",
  simulation: {
    fixedDt: 1 / 240,
    maxSubSteps: 20,
    maxFrameDt: 1 / 20,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "Evaporation/condensation transitions follow first-order rate laws.",
      "Salt dissolution scales with exposed surface and concentration factor.",
      "Particles are a visualization layer over rate-driven phase exchange.",
    ],
    validRange: [
      "temperature in [0.2, 2.0]",
      "humidity in [0.05, 0.8]",
      "salt concentration in [0, 0.9]",
    ],
    sources: getBenchmarkSources("v1-ch01-s03-atomic-processes"),
  },
  params: [
    {
      id: "temperature",
      label: "temperature",
      min: 0.2,
      max: 2.0,
      step: 0.05,
      default: 0.8,
    },
    {
      id: "humidity",
      label: "humidity",
      min: 0.05,
      max: 0.8,
      step: 0.05,
      default: 0.3,
    },
    {
      id: "saltConcentration",
      label: "salt concentration",
      min: 0,
      max: 0.9,
      step: 0.05,
      default: 0.2,
    },
  ],
  create: (params) => buildState(params),
  step: (state, params, dt) => stepState(state, params, dt),
  draw: (ctx, state, _params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const pad = 16;
    const half = (size.width - pad * 3) / 2;
    const leftX = pad;
    const rightX = pad * 2 + half;
    const boxY = pad;
    const boxH = size.height - pad * 2;

    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1;
    ctx.strokeRect(leftX, boxY, half, boxH);
    ctx.strokeRect(rightX, boxY, half, boxH);

    ctx.strokeStyle = "#cbd5f5";
    ctx.beginPath();
    ctx.moveTo(leftX, boxY + boxH / 2);
    ctx.lineTo(leftX + half, boxY + boxH / 2);
    ctx.stroke();

    for (const particle of state.particles) {
      const x = leftX + ((particle.x + 1) / 2) * half;
      const y = boxY + ((1 - particle.y) / 2) * boxH;
      ctx.fillStyle = particle.phase === "gas" ? "#0f172a" : "#2563eb";
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    const grid = state.salt.length;
    const cell = half / grid;
    for (let i = 0; i < grid; i += 1) {
      for (let j = 0; j < grid; j += 1) {
        const x = rightX + i * cell;
        const y = boxY + j * cell;
        ctx.fillStyle = state.salt[i][j] ? "#f97316" : "#f1f5f9";
        ctx.fillRect(x + 2, y + 2, cell - 4, cell - 4);
      }
    }

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("gas", leftX + 6, boxY + 14);
    ctx.fillText("liquid", leftX + 6, boxY + boxH - 6);
    ctx.fillText("salt lattice", rightX + 6, boxY + 14);
  },
  metrics: (state) => metrics(state),
  charts: (state) => charts(state),
  validate: (state) => {
    const err = conservationError(state);
    const rate = state.time > 0 ? state.evapCount / state.time : 0;
    const cond = state.time > 0 ? state.condCount / state.time : 0;
    return statusFromChecks([
      numericCheck("conservation", "Conservation error", err, 0, 1e-6),
      numericCheck("flux-balance", "Evap-cond balance", rate, cond, Math.max(0.6, 0.4 * Math.max(rate, cond))),
    ]);
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 360; i += 1) {
    stepState(state, params, 0.01);
  }
  return metrics(state);
}
