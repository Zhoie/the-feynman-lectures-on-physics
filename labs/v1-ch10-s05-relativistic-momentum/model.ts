import type { ChartSpec, LabModel, MetricValue } from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";
import {
  benchmarkSeries,
  getCh10BenchmarkProfile,
} from "@/labs/_benchmarks/ch10";
import { seriesRmsResidual } from "@/labs/v1-ch10-shared/measurement";

type Params = {
  mass: number;
  vMax: number;
  vProbe: number;
};

type Point = {
  beta: number;
  v: number;
  pc: number;
  pr: number;
  ratio: number;
  errPct: number;
  approxErrPct: number;
};

type State = {
  points: Point[];
};

const C = 299_792_458;
const BETA_CAP = 1 - 1e-12;
const DATASET_ID = "ch10-s05-relativistic-momentum";

const DEFAULT_PARAMS: Params = {
  mass: 1.0,
  vMax: 0.95 * C,
  vProbe: 0.75 * C,
};

function normalizeParams(input?: Partial<Params>): Params {
  return {
    ...DEFAULT_PARAMS,
    ...input,
  };
}

function clampVelocity(v: number) {
  const max = BETA_CAP * C;
  return Math.max(1, Math.min(max, v));
}

function betaOf(v: number) {
  return clampVelocity(v) / C;
}

function gammaFromBeta(betaInput: number) {
  const beta = Math.max(0, Math.min(BETA_CAP, betaInput));
  return 1 / Math.sqrt(Math.max(1e-15, 1 - beta * beta));
}

function relativisticMomentum(mass: number, velocity: number) {
  const beta = betaOf(velocity);
  return gammaFromBeta(beta) * mass * velocity;
}

function pointFor(mass: number, velocity: number): Point {
  const v = clampVelocity(velocity);
  const beta = betaOf(v);
  const pc = mass * v;
  const pr = relativisticMomentum(mass, v);
  const ratio = pc > 0 ? pr / pc : 1;
  const errPct = pr > 0 ? ((pr - pc) / pr) * 100 : 0;
  const approxErrPct = 0.5 * beta * beta * 100;
  return { beta, v, pc, pr, ratio, errPct, approxErrPct };
}

function buildState(input?: Partial<Params>): State {
  const params = normalizeParams(input);
  const mass = Math.max(1e-3, params.mass);
  const steps = 84;
  const maxV = clampVelocity(params.vMax);
  const points: Point[] = [];
  for (let i = 0; i < steps; i += 1) {
    const alpha = i / (steps - 1);
    points.push(pointFor(mass, Math.max(1, alpha * maxV)));
  }
  return { points };
}

function nearestPointByBeta(points: Point[], beta: number) {
  let nearest = points[0];
  let best = Math.abs(points[0].beta - beta);
  for (let i = 1; i < points.length; i += 1) {
    const candidate = points[i];
    const dist = Math.abs(candidate.beta - beta);
    if (dist < best) {
      best = dist;
      nearest = candidate;
    }
  }
  return nearest;
}

function formulaResidualPct(state: State) {
  if (!state.points.length) return 0;
  const band = state.points.filter((point) => point.beta >= 0.05 && point.beta <= 0.95);
  const points = band.length ? band : state.points;
  let sumSq = 0;
  for (const point of points) {
    const expected = gammaFromBeta(point.beta) * point.v;
    const rel = expected > 0 ? (point.pr / point.pc - expected / point.v) / (expected / point.v) : 0;
    sumSq += rel * rel;
  }
  const rms = Math.sqrt(sumSq / points.length);
  return rms * 100;
}

function datasetResidual(state: State) {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  if (!profile || !state.points.length) return 0;
  const simulated = benchmarkSeries(profile).map((point) => {
    const nearest = nearestPointByBeta(state.points, point.x);
    return { x: point.x, y: nearest.ratio };
  });
  return seriesRmsResidual(simulated, benchmarkSeries(profile));
}

function metrics(state: State, input: Partial<Params>): MetricValue[] {
  const params = normalizeParams(input);
  const mass = Math.max(1e-3, params.mass);
  const probe = pointFor(mass, Math.min(params.vProbe, params.vMax));
  const formulaResidual = formulaResidualPct(state);
  const residualSigma = datasetResidual(state);

  return [
    { id: "beta_probe", label: "Probe beta", value: probe.beta, precision: 5 },
    { id: "p_classical", label: "Classical momentum", value: probe.pc, precision: 3, unit: "kg*m/s" },
    { id: "p_relativistic", label: "Relativistic momentum", value: probe.pr, precision: 3, unit: "kg*m/s" },
    decorateMetric(
      {
        id: "relative_error_pct",
        label: "Classical underestimation",
        value: probe.errPct,
        unit: "%",
        precision: 3,
      },
      probe.approxErrPct,
      Math.max(0.2, probe.approxErrPct * 0.35 + 0.8)
    ),
    decorateMetric(
      {
        id: "formula_residual_pct",
        label: "SI model residual vs formula",
        value: formulaResidual,
        unit: "%",
        precision: 4,
      },
      0,
      2
    ),
    decorateMetric(
      {
        id: "dataset_residual_sigma",
        label: "Dataset residual (sigma RMS)",
        value: residualSigma,
        precision: 3,
      },
      0,
      2
    ),
  ];
}

function charts(state: State): ChartSpec[] {
  const profile = getCh10BenchmarkProfile(DATASET_ID);
  const profileSeries = profile ? benchmarkSeries(profile) : [];

  return [
    {
      id: "momentum-si",
      title: "Momentum in SI units",
      xLabel: "velocity (m/s)",
      yLabel: "momentum (kg*m/s)",
      series: [
        {
          id: "classical",
          label: "p = m v",
          data: state.points.map((point) => ({ x: point.v, y: point.pc })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: "relativistic",
          label: "p = gamma m v",
          data: state.points.map((point) => ({ x: point.v, y: point.pr })),
          color: "#0284c7",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "error-beta",
      title: "Relative error and low-beta approximation",
      xLabel: "beta",
      yLabel: "error (%)",
      series: [
        {
          id: "sim-error",
          label: "simulation error",
          data: state.points.map((point) => ({ x: point.beta, y: point.errPct })),
          color: "#f97316",
          role: "simulation",
        },
        {
          id: "approx",
          label: "beta^2 / 2 approximation",
          data: state.points.map((point) => ({ x: point.beta, y: point.approxErrPct })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
    },
    {
      id: "ratio-dataset",
      title: "Relativistic ratio calibration",
      xLabel: "beta",
      yLabel: "pr / pc",
      series: [
        {
          id: "sim-ratio",
          label: "simulation",
          data: state.points.map((point) => ({ x: point.beta, y: point.ratio })),
          color: "#0284c7",
          role: "simulation",
        },
        {
          id: "dataset",
          label: "dataset reference",
          data: profileSeries.map((point) => ({ x: point.x, y: point.y })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
      bands: profile
        ? [
            {
              id: "dataset-band",
              label: "dataset uncertainty",
              color: "rgba(148, 163, 184, 0.18)",
              data: profileSeries.map((point) => ({
                x: point.x,
                yMin: Math.max(0, point.y - Math.abs(point.uncertainty ?? 0)),
                yMax: point.y + Math.abs(point.uncertainty ?? 0),
              })),
            },
          ]
        : undefined,
    },
  ];
}

export const model: LabModel<Params, State> = {
  id: "v1-ch10-s05-relativistic-momentum",
  title: "Relativistic Momentum in SI Units",
  summary:
    "Compares classical and relativistic momentum using c = 299,792,458 m/s. The UI reports SI momentum, beta, low-beta approximation, and dataset residuals.",
  archetype: "Relativistic Momentum",
  simulation: {
    fixedDt: 1 / 120,
    maxSubSteps: 4,
    maxFrameDt: 1 / 12,
  },
  meta: {
    fidelity: "quantitative",
    assumptions: [
      "SI velocity and momentum are canonical outputs.",
      "Numerical evaluation clamps beta below 1 for stability near light speed.",
      "Reference overlays include low-beta approximation and curated benchmark profile.",
    ],
    validRange: [
      "mass in [0.1, 10.0] kg",
      "velocity range in [1e6, 0.98c] m/s",
      "probe velocity <= max velocity",
    ],
    sources: getBenchmarkSources("v1-ch10-s05-relativistic-momentum"),
    notes:
      "Acceptance gate: SI formula residual <= 2.0% over calibrated beta band, dataset residual <= 2 sigma.",
  },
  params: [
    {
      id: "mass",
      label: "mass",
      min: 0.1,
      max: 10,
      step: 0.1,
      unit: "kg",
      default: DEFAULT_PARAMS.mass,
    },
    {
      id: "vMax",
      label: "max velocity",
      min: 1_000_000,
      max: 0.98 * C,
      step: 1_000_000,
      unit: "m/s",
      default: DEFAULT_PARAMS.vMax,
    },
    {
      id: "vProbe",
      label: "probe velocity",
      min: 1_000_000,
      max: 0.98 * C,
      step: 1_000_000,
      unit: "m/s",
      default: DEFAULT_PARAMS.vProbe,
      visibleWhen: (params) => (params.vMax ?? 0) >= 1_000_000,
    },
  ],
  create: (params) => buildState(params),
  step: () => {},
  draw: (ctx, state, params, size) => {
    ctx.clearRect(0, 0, size.width, size.height);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, size.width, size.height);

    const pad = 44;
    const x0 = pad;
    const x1 = size.width - pad;
    const y0 = pad;
    const y1 = size.height - pad;

    const maxV = clampVelocity(params.vMax);
    const maxP = Math.max(...state.points.map((point) => point.pr), 1);
    const mapX = (v: number) => x0 + (v / maxV) * (x1 - x0);
    const mapY = (p: number) => y1 - (p / maxP) * (y1 - y0);

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
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    state.points.forEach((point, index) => {
      const x = mapX(point.v);
      const y = mapY(point.pr);
      if (index === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.setLineDash([]);

    const probe = pointFor(Math.max(1e-3, params.mass), Math.min(params.vProbe, params.vMax));
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.arc(mapX(probe.v), mapY(probe.pr), 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#334155";
    ctx.font = "12px system-ui";
    ctx.fillText(`beta=${probe.beta.toFixed(4)}`, x0, y0 - 24);
    ctx.fillText(`v=${probe.v.toExponential(3)} m/s`, x0, y0 - 8);
    ctx.fillText(`err=${probe.errPct.toFixed(3)}%`, x0 + 200, y0 - 8);
    ctx.fillText("v (m/s)", x1 - 42, y1 + 22);
    ctx.fillText("p", x0 - 14, y0 - 8);
  },
  metrics: (state, params) => metrics(state, params),
  charts: (state) => charts(state),
  validate: (state) => {
    const residualPct = formulaResidualPct(state);
    const residualSigma = datasetResidual(state);
    return statusFromChecks([
      numericCheck("formula", "Formula residual (%)", residualPct, 0, 2),
      numericCheck("dataset", "Dataset residual (sigma)", residualSigma, 0, 2),
    ]);
  },
};

export function computeMetrics(input: Partial<Params>) {
  const params = normalizeParams(input);
  const state = buildState(params);
  return metrics(state, params);
}
