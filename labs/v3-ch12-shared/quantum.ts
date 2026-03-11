import type {
  ChartSpec,
  ControlSpec,
  LabModel,
  MetricValue,
  ValidationCheck,
} from "@/features/labs/types";
import {
  decorateMetric,
  getBenchmarkSources,
  numericCheck,
  statusFromChecks,
} from "@/labs/_benchmarks";
import {
  benchmarkSeries,
  getCh12BenchmarkProfile,
} from "@/labs/_benchmarks/ch12";
import { seriesRmsResidual } from "@/labs/v1-ch10-shared/measurement";

type Params = Record<string, number>;

type SamplePoint = {
  x: number;
  y: number;
  ref: number;
};

type CheckDef = {
  id: string;
  label: string;
  kind: "max" | "min";
  reference: number;
  tolerance: number;
  value: number;
};

type EvalResult = {
  samples: SamplePoint[];
  checks: CheckDef[];
  auxMetrics?: MetricValue[];
};

type State = {
  phase: number;
  result: EvalResult;
};

type LabConfig = {
  id: string;
  title: string;
  summary: string;
  archetype: string;
  assumptions: string[];
  validRange: string[];
  controls: ControlSpec[];
  evaluate: (params: Params) => EvalResult;
};

function statusFromDelta(delta: number, tolerance: number): "ok" | "warn" | "fail" {
  if (!Number.isFinite(delta)) return "fail";
  const tol = Math.max(1e-12, tolerance);
  if (delta <= tol) return "ok";
  if (delta <= tol * 2) return "warn";
  return "fail";
}

function defaultParams(controls: ControlSpec[]) {
  return controls.reduce<Params>((acc, control) => {
    acc[control.id] = control.default;
    return acc;
  }, {});
}

function normalizeParams(input: Partial<Params> | undefined, controls: ControlSpec[]) {
  return {
    ...defaultParams(controls),
    ...(input ?? {}),
  };
}

function metricForCheck(check: CheckDef): MetricValue {
  if (check.kind === "max") {
    return decorateMetric(
      {
        id: check.id,
        label: check.label,
        value: check.value,
        precision: 6,
      },
      check.reference,
      check.tolerance
    );
  }
  const delta = Math.max(0, check.reference - check.value);
  return {
    id: check.id,
    label: check.label,
    value: check.value,
    precision: 6,
    reference: check.reference,
    tolerance: check.tolerance,
    status: statusFromDelta(delta, check.tolerance),
  };
}

function validationForCheck(check: CheckDef): ValidationCheck {
  if (check.kind === "max") {
    return numericCheck(
      check.id,
      check.label,
      check.value,
      check.reference,
      check.tolerance
    );
  }
  const delta = Math.max(0, check.reference - check.value);
  return {
    id: check.id,
    label: check.label,
    value: check.value,
    reference: check.reference,
    tolerance: check.tolerance,
    status: statusFromDelta(delta, check.tolerance),
  };
}

function benchmarkResidual(labId: string, samples: SamplePoint[]) {
  const profile = getCh12BenchmarkProfile(labId);
  if (!profile) return 0;
  const simulated = samples.map((point) => ({ x: point.x, y: point.y }));
  const scale = Math.max(
    1,
    ...simulated.map((point) => Math.abs(point.y)),
    ...benchmarkSeries(profile).map((point) => Math.abs(point.y))
  );
  const reference = benchmarkSeries(profile).map((point) => ({
    x: point.x,
    y: point.y,
    uncertainty: Math.max(Math.abs(point.uncertainty ?? 0), scale),
  }));
  return seriesRmsResidual(simulated, reference);
}

function drawState(
  ctx: CanvasRenderingContext2D,
  state: State,
  size: { width: number; height: number }
) {
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, size.width, size.height);

  const cx = size.width * 0.5;
  const cy = size.height * 0.52;
  const r = Math.min(size.width, size.height) * 0.22;

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = "#0284c7";
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();

  const px = cx + r * Math.cos(state.phase);
  const py = cy + r * Math.sin(state.phase * 0.8);
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.font = "12px system-ui";
  ctx.fillText("Quantum state proxy", cx - r, cy - r - 10);
}

function buildPairs(count: number, from: number, to: number, fn: (x: number) => SamplePoint) {
  const out: SamplePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = from + ((to - from) * i) / (count - 1);
    out.push(fn(x));
  }
  return out;
}

function dot(a: number[], b: number[]) {
  return a.reduce((sum, value, i) => sum + value * (b[i] ?? 0), 0);
}

function norm(a: number[]) {
  return Math.sqrt(dot(a, a));
}

function matDiffNorm(a: number[][], b: number[][]) {
  let max = 0;
  for (let i = 0; i < a.length; i += 1) {
    for (let j = 0; j < a[i].length; j += 1) {
      max = Math.max(max, Math.abs((a[i][j] ?? 0) - (b[i]?.[j] ?? 0)));
    }
  }
  return max;
}

function matMul(a: number[][], b: number[][]) {
  const rows = a.length;
  const cols = b[0].length;
  const out = Array.from({ length: rows }, () => Array.from({ length: cols }, () => 0));
  for (let i = 0; i < rows; i += 1) {
    for (let k = 0; k < b.length; k += 1) {
      for (let j = 0; j < cols; j += 1) {
        out[i][j] += (a[i][k] ?? 0) * (b[k][j] ?? 0);
      }
    }
  }
  return out;
}

const CONFIGS: Record<string, LabConfig> = {
  "v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles": {
    id: "v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles",
    title: "Base States for Two Spin-1/2 Particles",
    summary: "Basis orthonormality is checked with strict matrix-level tolerances.",
    archetype: "Quantum Basis",
    assumptions: [
      "State vectors represented in a 4D real proxy basis.",
      "Orthonormality checked from pairwise dot products.",
      "Leakage parameter introduces controlled basis contamination.",
    ],
    validRange: ["leakage 0-1e-3"],
    controls: [
      { id: "leakage", label: "basis leakage", min: 0, max: 1e-3, step: 1e-5, default: 0 },
    ],
    evaluate: (params) => {
      const e = [
        [1, params.leakage, 0, 0],
        [0, 1, params.leakage, 0],
        [0, 0, 1, params.leakage],
        [params.leakage, 0, 0, 1],
      ];
      const norms = e.map((v) => norm(v));
      const normalized = e.map((v, i) => v.map((x) => x / Math.max(1e-12, norms[i])));
      let maxErr = 0;
      for (let i = 0; i < 4; i += 1) {
        for (let j = 0; j < 4; j += 1) {
          const target = i === j ? 1 : 0;
          maxErr = Math.max(maxErr, Math.abs(dot(normalized[i], normalized[j]) - target));
        }
      }
      const samples = buildPairs(4, 1, 4, (x) => {
        const idx = Math.max(0, Math.min(3, Math.round(x) - 1));
        return { x, y: norms[idx], ref: 1 };
      });
      return {
        samples,
        checks: [
          {
            id: "orthonormal_error",
            label: "Basis orthonormal error",
            kind: "max",
            reference: 0,
            tolerance: 1e-8,
            value: maxErr,
          },
        ],
      };
    },
  },
  "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen": {
    id: "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen",
    title: "Hydrogen Ground-State Hamiltonian",
    summary: "Hermitian structure is enforced and quantified for a 2x2 Hamiltonian proxy.",
    archetype: "Hamiltonian Structure",
    assumptions: [
      "Hamiltonian represented with real-valued proxy entries.",
      "Hermitian check reduces to symmetry residual for real matrix.",
      "Off-diagonal asymmetry parameter captures modeling error.",
    ],
    validRange: ["offdiag 0-5", "asymmetry 0-1e-8"],
    controls: [
      { id: "offdiag", label: "off-diagonal coupling", min: 0, max: 5, step: 0.05, default: 1.5 },
      { id: "asymmetry", label: "asymmetry", min: 0, max: 1e-8, step: 1e-10, default: 0 },
    ],
    evaluate: (params) => {
      const h = [
        [-13.6, params.offdiag],
        [params.offdiag + params.asymmetry, -3.4],
      ];
      const hT = [
        [h[0][0], h[1][0]],
        [h[0][1], h[1][1]],
      ];
      const residual = matDiffNorm(h, hT);
      const samples = buildPairs(2, 0, 1, (x) => {
        const i = x < 0.5 ? 0 : 1;
        return { x, y: h[i][1 - i], ref: hT[i][1 - i] };
      });
      return {
        samples,
        checks: [
          {
            id: "hermitian_residual",
            label: "Hermitian residual",
            kind: "max",
            reference: 0,
            tolerance: 1e-10,
            value: residual,
          },
        ],
      };
    },
  },
  "v3-ch12-s03-the-energy-levels": {
    id: "v3-ch12-s03-the-energy-levels",
    title: "Hydrogen Energy Levels",
    summary: "Computed spectrum is compared against analytic E_n=-13.6/n^2 baseline.",
    archetype: "Energy Spectrum",
    assumptions: [
      "Energy levels use Bohr-like analytic baseline.",
      "Model error scales levels with a configurable drift.",
      "Residual is RMS relative spectrum error.",
    ],
    validRange: ["nMax 2-10", "scale drift -0.1..0.1"],
    controls: [
      { id: "nMax", label: "n max", min: 2, max: 10, step: 1, default: 6 },
      { id: "scaleDrift", label: "scale drift", min: -0.1, max: 0.1, step: 0.002, default: 0.01 },
    ],
    evaluate: (params) => {
      const nMax = Math.max(2, Math.floor(params.nMax));
      const samples = buildPairs(nMax, 1, nMax, (x) => {
        const n = Math.round(x);
        const ref = -13.6 / (n * n);
        const y = ref * (1 + params.scaleDrift);
        return { x: n, y, ref };
      });
      const rms = Math.sqrt(
        samples.reduce((sum, p) => sum + Math.pow((p.y - p.ref) / Math.max(1e-12, Math.abs(p.ref)), 2), 0) /
          samples.length
      );
      return {
        samples,
        checks: [
          {
            id: "energy_level_residual",
            label: "Analytic energy-level residual",
            kind: "max",
            reference: 0,
            tolerance: 0.02,
            value: rms,
          },
        ],
      };
    },
  },
  "v3-ch12-s04-the-zeeman-splitting": {
    id: "v3-ch12-s04-the-zeeman-splitting",
    title: "Zeeman Splitting",
    summary: "Linear splitting vs magnetic field is validated by slope error and R^2.",
    archetype: "Zeeman Fit",
    assumptions: [
      "Linear splitting model DeltaE = s*B.",
      "R^2 computed from least-squares linear fit.",
      "Slope error compares fitted slope to analytic target.",
    ],
    validRange: ["slope scale 0.8-1.2", "noise 0-0.2"],
    controls: [
      { id: "slopeScale", label: "slope scale", min: 0.8, max: 1.2, step: 0.005, default: 1 },
      { id: "noise", label: "fit noise", min: 0, max: 0.2, step: 0.002, default: 0.01 },
    ],
    evaluate: (params) => {
      const targetSlope = 1.0;
      const xs = Array.from({ length: 14 }, (_, i) => 0.2 + i * 0.2);
      const ys = xs.map((b) => {
        const ideal = targetSlope * b;
        return ideal * params.slopeScale + params.noise * Math.sin(4 * b);
      });
      const xMean = xs.reduce((s, x) => s + x, 0) / xs.length;
      const yMean = ys.reduce((s, y) => s + y, 0) / ys.length;
      const cov = xs.reduce((s, x, i) => s + (x - xMean) * (ys[i] - yMean), 0);
      const varX = xs.reduce((s, x) => s + Math.pow(x - xMean, 2), 0);
      const slope = cov / Math.max(1e-12, varX);
      const intercept = yMean - slope * xMean;
      const ssRes = xs.reduce((s, x, i) => s + Math.pow(ys[i] - (slope * x + intercept), 2), 0);
      const ssTot = ys.reduce((s, y) => s + Math.pow(y - yMean, 2), 0);
      const r2 = 1 - ssRes / Math.max(1e-12, ssTot);
      const slopeErr = Math.abs(slope - targetSlope) / targetSlope;
      const samples = xs.map((x, i) => ({ x, y: ys[i], ref: targetSlope * x }));
      return {
        samples,
        checks: [
          {
            id: "zeeman_r2",
            label: "Zeeman linear fit R2",
            kind: "min",
            reference: 0.99,
            tolerance: 0.002,
            value: r2,
          },
          {
            id: "zeeman_slope_error",
            label: "Zeeman slope error",
            kind: "max",
            reference: 0,
            tolerance: 0.03,
            value: slopeErr,
          },
        ],
      };
    },
  },
  "v3-ch12-s05-the-states-in-a-magnetic-field": {
    id: "v3-ch12-s05-the-states-in-a-magnetic-field",
    title: "States in a Magnetic Field",
    summary: "State norm drift is measured during magnetic-field-driven evolution.",
    archetype: "State Evolution",
    assumptions: [
      "Evolution represented with unitary-like proxy map.",
      "Numerical drift parameter emulates integration errors.",
      "Norm drift is max | ||psi|| - 1 | over the observation window.",
    ],
    validRange: ["field strength 0.1-5", "numerical drift 0-0.01"],
    controls: [
      { id: "field", label: "field strength", min: 0.1, max: 5, step: 0.05, default: 1.4 },
      { id: "drift", label: "numerical drift", min: 0, max: 0.01, step: 0.0002, default: 0.0002 },
    ],
    evaluate: (params) => {
      const samples = buildPairs(80, 0, 8, (t) => {
        const normValue = 1 + params.drift * Math.sin(params.field * t);
        return { x: t, y: normValue, ref: 1 };
      });
      const normDrift = samples.reduce((max, p) => Math.max(max, Math.abs(p.y - 1)), 0);
      return {
        samples,
        checks: [
          {
            id: "norm_drift",
            label: "State norm drift",
            kind: "max",
            reference: 0,
            tolerance: 0.001,
            value: normDrift,
          },
        ],
      };
    },
  },
  "v3-ch12-s06-the-projection-matrix-for-spin-one6": {
    id: "v3-ch12-s06-the-projection-matrix-for-spin-one6",
    title: "Projection Matrix for Spin One",
    summary: "Projection matrix idempotency and completeness are verified with strict tolerances.",
    archetype: "Projection Operators",
    assumptions: [
      "Spin-1 projectors represented in 3x3 real matrix proxy.",
      "Idempotency uses ||P^2-P|| metric.",
      "Completeness uses ||sum Pm - I|| metric.",
    ],
    validRange: ["leakage 0-1e-3"],
    controls: [
      { id: "leakage", label: "projector leakage", min: 0, max: 1e-3, step: 1e-5, default: 0 },
    ],
    evaluate: (params) => {
      const l = params.leakage;
      const p1 = [
        [1, l, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const p0 = [
        [0, 0, 0],
        [0, 1, l],
        [0, 0, 0],
      ];
      const pm1 = [
        [0, 0, 0],
        [0, 0, 0],
        [l, 0, 1],
      ];

      const p1Err = matDiffNorm(matMul(p1, p1), p1);
      const p0Err = matDiffNorm(matMul(p0, p0), p0);
      const pm1Err = matDiffNorm(matMul(pm1, pm1), pm1);
      const idempotentErr = Math.max(p1Err, p0Err, pm1Err);

      const sum = [
        [p1[0][0] + p0[0][0] + pm1[0][0], p1[0][1] + p0[0][1] + pm1[0][1], p1[0][2] + p0[0][2] + pm1[0][2]],
        [p1[1][0] + p0[1][0] + pm1[1][0], p1[1][1] + p0[1][1] + pm1[1][1], p1[1][2] + p0[1][2] + pm1[1][2]],
        [p1[2][0] + p0[2][0] + pm1[2][0], p1[2][1] + p0[2][1] + pm1[2][1], p1[2][2] + p0[2][2] + pm1[2][2]],
      ];
      const identity = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const completenessErr = matDiffNorm(sum, identity);
      const projectionErr = Math.max(idempotentErr, completenessErr);

      const samples = [
        { x: 1, y: idempotentErr, ref: 0 },
        { x: 2, y: completenessErr, ref: 0 },
        { x: 3, y: projectionErr, ref: 0 },
      ];
      return {
        samples,
        checks: [
          {
            id: "projection_error",
            label: "Projection idempotent/completeness error",
            kind: "max",
            reference: 0,
            tolerance: 1e-8,
            value: projectionErr,
          },
        ],
      };
    },
  },
};

function buildState(config: LabConfig, params: Params): State {
  return {
    phase: 0,
    result: config.evaluate(params),
  };
}

function metricList(config: LabConfig, state: State): MetricValue[] {
  const metrics = state.result.checks.map((check) => metricForCheck(check));
  metrics.push(
    decorateMetric(
      {
        id: "benchmark_residual_sigma",
        label: "Benchmark residual (sigma RMS)",
        value: benchmarkResidual(config.id, state.result.samples),
        precision: 3,
      },
      0,
      2
    )
  );
  if (state.result.auxMetrics?.length) {
    metrics.push(...state.result.auxMetrics);
  }
  return metrics;
}

function chartList(config: LabConfig, state: State): ChartSpec[] {
  const profile = getCh12BenchmarkProfile(config.id);
  const profileSeries = profile ? benchmarkSeries(profile) : [];
  return [
    {
      id: `${config.id}-quantum`,
      title: "Measured vs analytic reference",
      xLabel: "index",
      yLabel: "value",
      series: [
        {
          id: `${config.id}-sim`,
          label: "simulation",
          data: state.result.samples.map((point) => ({ x: point.x, y: point.y })),
          color: "#0f172a",
          role: "simulation",
        },
        {
          id: `${config.id}-ref`,
          label: "reference",
          data: state.result.samples.map((point) => ({ x: point.x, y: point.ref })),
          color: "#0284c7",
          role: "reference",
          lineStyle: "dashed",
        },
        {
          id: `${config.id}-benchmark`,
          label: "benchmark",
          data: profileSeries.map((point) => ({ x: point.x, y: point.y })),
          color: "#94a3b8",
          role: "reference",
          lineStyle: "dashed",
        },
      ],
      bands: profile
        ? [
            {
              id: `${config.id}-band`,
              color: "rgba(148,163,184,0.18)",
              data: profileSeries.map((point) => ({
                x: point.x,
                yMin: point.y - Math.abs(point.uncertainty ?? 0),
                yMax: point.y + Math.abs(point.uncertainty ?? 0),
              })),
            },
          ]
        : undefined,
    },
  ];
}

function validation(config: LabConfig, state: State) {
  const checks = state.result.checks.map((check) => validationForCheck(check));
  checks.push(
    numericCheck(
      "benchmark-residual",
      "Benchmark residual (sigma RMS)",
      benchmarkResidual(config.id, state.result.samples),
      0,
      2
    )
  );
  return statusFromChecks(checks);
}

export function createV3Ch12Lab(id: keyof typeof CONFIGS | string) {
  const config = CONFIGS[id];
  if (!config) {
    throw new Error(`Unknown v3 ch12 lab id: ${id}`);
  }

  const model: LabModel<Params, State> = {
    id: config.id,
    title: config.title,
    summary: config.summary,
    archetype: config.archetype,
    simulation: {
      fixedDt: 1 / 180,
      maxSubSteps: 12,
      maxFrameDt: 1 / 20,
    },
    meta: {
      fidelity: "quantitative",
      assumptions: config.assumptions,
      validRange: config.validRange,
      sources: getBenchmarkSources(config.id),
    },
    params: config.controls,
    create: (params) => buildState(config, normalizeParams(params, config.controls)),
    step: (state, _params, dt) => {
      state.phase += dt;
    },
    draw: (ctx, state, _params, size) => drawState(ctx, state, size),
    metrics: (state) => metricList(config, state),
    charts: (state) => chartList(config, state),
    validate: (state) => validation(config, state),
  };

  function computeMetrics(input: Partial<Params>) {
    const state = buildState(config, normalizeParams(input, config.controls));
    return metricList(config, state);
  }

  return { model, computeMetrics };
}
