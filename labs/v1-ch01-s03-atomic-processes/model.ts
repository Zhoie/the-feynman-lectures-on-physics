import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";

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
  seed: number;
};

function rand(state: State) {
  state.seed = (state.seed * 1664525 + 1013904223) >>> 0;
  return state.seed / 4294967296;
}

function buildState(params: Params): State {
  const count = 140;
  const gasCount = Math.floor(count * params.humidity);
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

  const saltSize = 8;
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
    seed,
  };
}

function stepSalt(state: State, params: Params) {
  const size = state.salt.length;
  const dissolveRate =
    0.01 * params.temperature * (1 - params.saltConcentration);
  if (rand(state) > dissolveRate) return;

  const candidates: [number, number][] = [];
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      if (!state.salt[i][j]) continue;
      const isEdge = i === 0 || j === 0 || i === size - 1 || j === size - 1;
      if (isEdge) candidates.push([i, j]);
    }
  }
  if (candidates.length === 0) return;
  const [i, j] = candidates[Math.floor(rand(state) * candidates.length)];
  state.salt[i][j] = false;
  state.dissolved += 1;
}

function stepState(state: State, params: Params, dt: number) {
  const temp = Math.max(0.05, params.temperature);
  const liquidDamp = 2.0;
  const gasDamp = 0.2;
  const noise = 0.4 * temp;
  const evapThreshold = 0.4 + temp * 0.8;
  const condThreshold = 0.3 + temp * 0.4;

  let evapEvents = 0;
  let condEvents = 0;

  for (const particle of state.particles) {
    const damp = particle.phase === "liquid" ? liquidDamp : gasDamp;
    particle.vx += -damp * particle.vx * dt + (rand(state) - 0.5) * noise;
    particle.vy += -damp * particle.vy * dt + (rand(state) - 0.5) * noise;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;

    if (particle.x < -1) particle.x += 2;
    if (particle.x > 1) particle.x -= 2;

    if (particle.y > 1) {
      particle.y = 1;
      particle.vy *= -0.4;
    }
    if (particle.y < -1) {
      particle.y = -1;
      particle.vy *= -0.4;
    }

    if (particle.phase === "liquid" && particle.y > 0) {
      if (particle.vy > evapThreshold) {
        particle.phase = "gas";
        evapEvents += 1;
      } else {
        particle.y = -0.05;
        particle.vy *= -0.2;
      }
    }

    if (particle.phase === "gas" && particle.y < 0) {
      if (Math.abs(particle.vy) < condThreshold) {
        particle.phase = "liquid";
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
      evap: evapEvents / dt,
      cond: condEvents / dt,
    });
    if (state.history.length > 120) state.history.shift();
  }

  stepSalt(state, params);
}

function metrics(state: State): MetricValue[] {
  const rate = state.time > 0 ? state.evapCount / state.time : 0;
  const cond = state.time > 0 ? state.condCount / state.time : 0;
  return [
    { id: "evap", label: "Evaporation rate", value: rate, precision: 3 },
    { id: "cond", label: "Condensation rate", value: cond, precision: 3 },
    { id: "salt", label: "Ions dissolved", value: state.dissolved, precision: 0 },
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
        },
        {
          id: "cond",
          label: "condensation",
          data: state.history.map((point) => ({ x: point.t, y: point.cond })),
          color: "#0284c7",
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s03-atomic-processes",
  title: "Evaporation, Condensation, and Dissolution",
  summary:
    "Particles exchange between liquid and gas at a dynamic equilibrium. A salt lattice dissolves faster when temperature is higher.",
  archetype: "Phase Exchange",
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
  draw: (ctx, state, params, size) => {
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
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  for (let i = 0; i < 300; i += 1) {
    stepState(state, params, 0.02);
  }
  return metrics(state);
}
