import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";

type Params = {
  vMax: number;
  noise: number;
  modelType: number;
  benchmarkMode: number;
};

type Point = { v: number; m: number };

type State = {
  data: Point[];
  fit: Point[];
  residuals: { v: number; r: number }[];
  modelLabel: string;
  benchmarkLabel: string;
  fitMass: number;
  residualSigma: number;
};

const C = 1;
const BASE_MASS = 1;

function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gamma(v: number) {
  const beta = Math.max(0, Math.min(0.999999, v / C));
  return 1 / Math.sqrt(1 - beta * beta);
}

function benchmarkMass(v: number, benchmarkMode: number) {
  const g = gamma(v);
  if (benchmarkMode < 0.5) {
    // Formula truth.
    return g * BASE_MASS;
  }
  // Data truth surrogate: formula + mild systematic instrument bias.
  const systematic = 1 + 0.012 * v * v;
  return g * BASE_MASS * systematic;
}

function buildState(params: Params): State {
  const benchmarkMode = Number.isFinite(params.benchmarkMode)
    ? params.benchmarkMode
    : 0;
  const count = 48;
  const data: Point[] = [];
  const vMax = Math.max(0.001, Math.min(0.99, params.vMax));
  const noise = Math.max(0, params.noise);
  const seed =
    Math.floor(vMax * 1000) * 97 +
    Math.floor(noise * 1000) * 193 +
    Math.floor(params.modelType * 100) * 17 +
    Math.floor(benchmarkMode * 100) * 31 +
    42;
  const rand = mulberry32(seed);

  for (let i = 0; i < count; i += 1) {
    const v = (i / (count - 1)) * vMax;
    const truthMass = benchmarkMass(v, benchmarkMode);
    const jitter = (rand() - 0.5) * 2 * noise;
    const measured = truthMass * (1 + jitter);
    data.push({ v, m: measured });
  }

  const modelLabel = params.modelType < 0.5 ? "m = const" : "m = gamma m0";
  const benchmarkLabel = benchmarkMode < 0.5 ? "formula truth" : "data truth";
  let fitMass = BASE_MASS;
  if (params.modelType < 0.5) {
    fitMass = data.reduce((sum, point) => sum + point.m, 0) / data.length;
  } else {
    let numerator = 0;
    let denominator = 0;
    for (const point of data) {
      const g = gamma(point.v);
      numerator += g * point.m;
      denominator += g * g;
    }
    fitMass = numerator / Math.max(1e-9, denominator);
  }

  const fit: Point[] = [];
  const residuals: { v: number; r: number }[] = [];
  for (const point of data) {
    const predicted = params.modelType < 0.5 ? fitMass : gamma(point.v) * fitMass;
    fit.push({ v: point.v, m: predicted });
    residuals.push({ v: point.v, r: (point.m - predicted) / Math.max(1e-9, predicted) });
  }

  const rms =
    Math.sqrt(
      residuals.reduce((sum, point) => sum + point.r * point.r, 0) /
        Math.max(1, residuals.length)
    ) || 0;

  return { data, fit, residuals, modelLabel, benchmarkLabel, fitMass, residualSigma: rms };
}

function metrics(state: State): MetricValue[] {
  const rms =
    Math.sqrt(
      state.residuals.reduce((sum, point) => sum + point.r * point.r, 0) /
        Math.max(1, state.residuals.length)
    ) || 0;
  const max =
    state.residuals.reduce(
      (best, point) => Math.max(best, Math.abs(point.r)),
      0
    ) || 0;
  return [
    { id: "model", label: "Model", value: state.modelLabel },
    { id: "benchmark", label: "Benchmark", value: state.benchmarkLabel },
    {
      id: "fitMass",
      label: "Fit m0",
      value: state.fitMass,
      precision: 4,
    },
    decorateMetric(
      {
        id: "rms",
        label: "RMS relative error",
        value: rms,
        precision: 4,
      },
      0,
      0.02
    ),
    decorateMetric(
      {
        id: "max",
        label: "Max relative error",
        value: max,
        precision: 4,
      },
      0,
      0.08
    ),
  ];
}

function charts(state: State): ChartSpec[] {
  const sigma = Math.max(1e-4, state.residualSigma);
  return [
    {
      id: "residuals",
      title: "Residual vs v/c",
      xLabel: "v/c",
      yLabel: "relative residual",
      series: [
        {
          id: "residual",
          label: "Residual",
          data: state.residuals.map((point) => ({
            x: point.v,
            y: point.r,
          })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "reference-zero",
          label: "reference 0",
          data: state.residuals.map((point) => ({ x: point.v, y: 0 })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
      bands: [
        {
          id: "residual-band",
          label: "±2σ",
          color: "rgba(14, 165, 233, 0.12)",
          data: state.residuals.map((point) => ({
            x: point.v,
            yMin: -2 * sigma,
            yMax: 2 * sigma,
          })),
        },
      ],
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch01-s01-introduction",
  title: "From Data to a Law",
  summary:
    "Fit a constant-mass law against a relativistic law. Switch between formula and data truth benchmarks, then compare residual bands.",
  archetype: "Law Fit",
  simulation: {
    fixedDt: 1 / 120,
    maxSubSteps: 4,
    maxFrameDt: 1 / 12,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "c = 1 reduced units with scalar mass fit.",
      "Data-truth mode injects a mild systematic bias to emulate empirical calibration drift.",
    ],
    validRange: [
      "v max in [0.01, 0.99]",
      "measurement noise in [0, 0.2]",
      "benchmark mode formula/data",
    ],
    sources: getBenchmarkSources("v1-ch01-s01-introduction"),
  },
  params: [
    {
      id: "vMax",
      label: "v max (c = 1)",
      min: 0.01,
      max: 0.99,
      step: 0.01,
      default: 0.3,
    },
    {
      id: "noise",
      label: "measurement noise",
      min: 0,
      max: 0.2,
      step: 0.01,
      default: 0.02,
    },
    {
      id: "modelType",
      label: "model",
      type: "select",
      default: 0,
      options: [
        { label: "m = const", value: 0 },
        { label: "m = gamma m0", value: 1 },
      ],
    },
    {
      id: "benchmarkMode",
      label: "benchmark",
      type: "select",
      default: 0,
      options: [
        { label: "formula truth", value: 0 },
        { label: "data truth", value: 1 },
      ],
    },
  ],
  create: (params) => buildState(params),
  step: () => {},
  draw: (ctx, state, params, size) => {
    const pad = 44;
    const x0 = pad;
    const x1 = size.width - pad;
    const y0 = pad;
    const y1 = size.height - pad;
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const values = state.data.map((point) => point.m).concat(state.fit.map((p) => p.m));
    const yMin = Math.min(...values) * 0.95;
    const yMax = Math.max(...values) * 1.05;
    const vMax = Math.max(0.01, params.vMax);

    const mapX = (v: number) => x0 + ((v / vMax) * (x1 - x0));
    const mapY = (m: number) => y1 - ((m - yMin) / Math.max(1e-9, yMax - yMin)) * (y1 - y0);

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
    state.fit.forEach((point, index) => {
      const x = mapX(point.v);
      const y = mapY(point.m);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#2563eb";
    state.data.forEach((point) => {
      const x = mapX(point.v);
      const y = mapY(point.m);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = "#0f172a";
    ctx.font = "12px system-ui";
    ctx.fillText("v/c", x1 - 18, y1 + 24);
    ctx.fillText("m(v)", x0 - 32, y0 - 10);
    ctx.fillText(state.benchmarkLabel, x0, y0 - 24);
  },
  metrics: (state) => metrics(state),
  charts: (state) => charts(state),
  validate: (state, params) => {
    const rms =
      Math.sqrt(
        state.residuals.reduce((sum, point) => sum + point.r * point.r, 0) /
          Math.max(1, state.residuals.length)
      ) || 0;
    const checks = [numericCheck("rms", "RMS residual", rms, 0, 0.02)];
    if (params.modelType < 0.5 && params.vMax > 0.8) {
      checks.push(
        numericCheck(
          "high-speed-constant-model",
          "High-speed residual should be visibly non-zero",
          rms,
          0.02,
          0.02
        )
      );
    }
    return statusFromChecks(checks);
  },
};

export function computeMetrics(params: Params) {
  const state = buildState(params);
  return metrics(state);
}
