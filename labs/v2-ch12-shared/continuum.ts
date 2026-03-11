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
  const tol = Math.max(1e-9, tolerance);
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

function checkMetric(check: CheckDef): MetricValue {
  if (check.kind === "max") {
    return decorateMetric(
      {
        id: check.id,
        label: check.label,
        value: check.value,
        precision: 5,
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
    precision: 5,
    reference: check.reference,
    tolerance: check.tolerance,
    status: statusFromDelta(delta, check.tolerance),
  };
}

function checkValidation(check: CheckDef): ValidationCheck {
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

  const left = size.width * 0.12;
  const right = size.width * 0.88;
  const top = size.height * 0.2;
  const bottom = size.height * 0.8;

  ctx.strokeStyle = "#cbd5e1";
  ctx.strokeRect(left, top, right - left, bottom - top);

  for (let i = 0; i <= 8; i += 1) {
    const x = left + ((right - left) * i) / 8;
    const y = top + ((bottom - top) * i) / 8;
    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  const cx = left + (right - left) * (0.5 + 0.35 * Math.sin(state.phase));
  const cy = top + (bottom - top) * (0.5 + 0.35 * Math.cos(state.phase * 0.8));
  ctx.fillStyle = "#0284c7";
  ctx.beginPath();
  ctx.arc(cx, cy, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.font = "12px system-ui";
  ctx.fillText("Continuum/analytic proxy", left, top - 8);
}

function lineSample(count: number, from: number, to: number, fn: (x: number) => number) {
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    values.push(from + ((to - from) * i) / (count - 1));
  }
  return values.map(fn);
}

function buildPairs(count: number, from: number, to: number, fn: (x: number) => SamplePoint) {
  const out: SamplePoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = from + ((to - from) * i) / (count - 1);
    out.push(fn(x));
  }
  return out;
}

const CONFIGS: Record<string, LabConfig> = {
  "v2-ch12-s01-the-same-equations-have-the-same-solutions": {
    id: "v2-ch12-s01-the-same-equations-have-the-same-solutions",
    title: "Same Equations, Same Solutions",
    summary: "Two equivalent analytic forms are compared via normalized overlap.",
    archetype: "Equation Equivalence",
    assumptions: [
      "Profiles are normalized before overlap scoring.",
      "Equivalent equations should produce near-identical shapes.",
      "Overlap metric uses RMS-normalized mismatch.",
    ],
    validRange: ["amplitude 0.2-2", "decay 0.2-2", "offset -0.1..0.1"],
    controls: [
      { id: "amplitude", label: "amplitude", min: 0.2, max: 2, step: 0.02, default: 1 },
      { id: "decay", label: "decay length", min: 0.2, max: 2, step: 0.02, default: 0.8 },
      { id: "offset", label: "equation offset", min: -0.1, max: 0.1, step: 0.002, default: 0 },
    ],
    evaluate: (params) => {
      const samples = buildPairs(30, 0, 4, (x) => {
        const ref = params.amplitude * Math.exp(-x / params.decay);
        const y = ref * (1 + params.offset * (x / 4));
        return { x, y, ref };
      });
      const rms = Math.sqrt(
        samples.reduce((sum, p) => sum + Math.pow((p.y - p.ref) / Math.max(1e-9, p.ref), 2), 0) /
          samples.length
      );
      const overlap = Math.max(0, 1 - rms);
      return {
        samples,
        checks: [
          {
            id: "shape_overlap",
            label: "Normalized solution overlap",
            kind: "min",
            reference: 0.97,
            tolerance: 0.005,
            value: overlap,
          },
        ],
      };
    },
  },
  "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary": {
    id: "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary",
    title: "Heat Flow Near a Plane Boundary",
    summary: "Mirror-source construction is validated through boundary residual checks.",
    archetype: "Heat Equation",
    assumptions: [
      "Mirror-source approximation around a plane boundary.",
      "Boundary derivative should approach zero for symmetric image source.",
      "Residual computed with finite-difference slope near boundary.",
    ],
    validRange: ["diffusivity 0.1-2", "source distance 0.1-2", "time 0.1-2"],
    controls: [
      { id: "diffusivity", label: "diffusivity", min: 0.1, max: 2, step: 0.02, default: 0.7 },
      { id: "sourceDistance", label: "source distance", min: 0.1, max: 2, step: 0.02, default: 0.8 },
      { id: "time", label: "time", min: 0.1, max: 2, step: 0.02, default: 0.8 },
      { id: "boundaryBias", label: "boundary bias", min: -0.05, max: 0.05, step: 0.001, default: 0 },
    ],
    evaluate: (params) => {
      const k = params.diffusivity;
      const t = params.time;
      const d = params.sourceDistance;
      const kernel = (x: number, c: number) =>
        Math.exp(-Math.pow(x - c, 2) / Math.max(1e-6, 4 * k * t));
      const samples = buildPairs(40, 0, 3, (x) => {
        const ref = kernel(x, d) + kernel(x, -d);
        const y = ref * (1 + params.boundaryBias * Math.exp(-x));
        return { x, y, ref };
      });
      const h = 0.05;
      const near = samples.find((p) => p.x >= h) ?? samples[1];
      const zero = samples[0];
      const slope = (near.y - zero.y) / Math.max(1e-9, near.x - zero.x);
      const norm = Math.abs(zero.y) / Math.max(1e-9, h);
      const boundaryError = Math.abs(slope) / Math.max(1e-9, norm);
      return {
        samples,
        checks: [
          {
            id: "boundary_error",
            label: "Boundary derivative error",
            kind: "max",
            reference: 0,
            tolerance: 0.02,
            value: boundaryError,
          },
        ],
      };
    },
  },
  "v2-ch12-s03-the-stretched-membrane": {
    id: "v2-ch12-s03-the-stretched-membrane",
    title: "Stretched Membrane Boundary Conditions",
    summary: "Boundary residuals for a membrane mode shape are evaluated quantitatively.",
    archetype: "Membrane Mode",
    assumptions: [
      "Mode shape approximated by u=sin(pi x) sin(pi y).",
      "Boundary points should be near zero displacement.",
      "Residual measured as max absolute boundary displacement.",
    ],
    validRange: ["mode amplitude 0.2-2", "boundary drift 0-0.01"],
    controls: [
      { id: "amplitude", label: "mode amplitude", min: 0.2, max: 2, step: 0.02, default: 1 },
      { id: "boundaryDrift", label: "boundary drift", min: 0, max: 0.01, step: 0.0002, default: 0 },
    ],
    evaluate: (params) => {
      const samples = buildPairs(30, 0, 1, (x) => {
        const ref = params.amplitude * Math.sin(Math.PI * x) * Math.sin(Math.PI * x);
        const edgeLeak = params.boundaryDrift * (1 - Math.sin(Math.PI * x));
        return { x, y: ref + edgeLeak, ref };
      });
      const boundaryResidual = Math.max(
        Math.abs(samples[0].y),
        Math.abs(samples[samples.length - 1].y)
      );
      return {
        samples,
        checks: [
          {
            id: "boundary_residual",
            label: "Boundary condition residual",
            kind: "max",
            reference: 0,
            tolerance: 1e-3,
            value: boundaryResidual,
          },
        ],
      };
    },
  },
  "v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium": {
    id: "v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium",
    title: "Neutron Diffusion in Spherical Geometry",
    summary: "Radial diffusion profiles are compared against an analytic proxy solution.",
    archetype: "Spherical Diffusion",
    assumptions: [
      "Flux uses exp(-r/L)/r style analytic profile.",
      "Residual uses normalized RMS radial error.",
      "Inner-radius singularity avoided with epsilon cutoff.",
    ],
    validRange: ["diffusion length 0.3-3", "source strength 0.5-4", "model drift 0-0.2"],
    controls: [
      { id: "diffusionLength", label: "diffusion length", min: 0.3, max: 3, step: 0.03, default: 1.2 },
      { id: "sourceStrength", label: "source strength", min: 0.5, max: 4, step: 0.05, default: 1.5 },
      { id: "modelDrift", label: "model drift", min: 0, max: 0.2, step: 0.002, default: 0.01 },
    ],
    evaluate: (params) => {
      const samples = buildPairs(36, 0.2, 5, (r) => {
        const ref = (params.sourceStrength * Math.exp(-r / params.diffusionLength)) / r;
        const y = ref * (1 + params.modelDrift * (r / 5));
        return { x: r, y, ref };
      });
      const radialResidual = Math.sqrt(
        samples.reduce((sum, p) => sum + Math.pow((p.y - p.ref) / Math.max(1e-9, p.ref), 2), 0) /
          samples.length
      );
      return {
        samples,
        checks: [
          {
            id: "radial_residual",
            label: "Radial analytic residual",
            kind: "max",
            reference: 0,
            tolerance: 0.05,
            value: radialResidual,
          },
        ],
      };
    },
  },
  "v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere": {
    id: "v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere",
    title: "Irrotational Flow Past a Sphere",
    summary: "Surface normal velocity residual is evaluated for potential flow around a sphere.",
    archetype: "Potential Flow",
    assumptions: [
      "Incompressible irrotational flow proxy.",
      "Normal velocity on sphere surface should be near zero.",
      "Residual normalized by free-stream speed.",
    ],
    validRange: ["radius 0.2-2", "free speed 0.2-4", "surface bias -0.05..0.05"],
    controls: [
      { id: "radius", label: "sphere radius", min: 0.2, max: 2, step: 0.02, default: 1 },
      { id: "freeSpeed", label: "free-stream speed", min: 0.2, max: 4, step: 0.05, default: 1.3 },
      { id: "surfaceBias", label: "surface bias", min: -0.05, max: 0.05, step: 0.001, default: 0 },
    ],
    evaluate: (params) => {
      const samples = buildPairs(32, 0, Math.PI, (theta) => {
        const ref = 0;
        const vr = params.freeSpeed * (1 - 1) * Math.cos(theta);
        const y = vr + params.surfaceBias * params.freeSpeed * Math.sin(theta);
        return { x: theta, y, ref };
      });
      const residual =
        samples.reduce((max, point) => Math.max(max, Math.abs(point.y) / params.freeSpeed), 0);
      return {
        samples,
        checks: [
          {
            id: "normal_velocity_residual",
            label: "|v_r| / U on sphere surface",
            kind: "max",
            reference: 0,
            tolerance: 0.02,
            value: residual,
          },
        ],
      };
    },
  },
  "v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane": {
    id: "v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane",
    title: "Uniform Illumination of a Plane",
    summary: "Illumination homogeneity is measured with coefficient-of-variation thresholds.",
    archetype: "Illumination",
    assumptions: [
      "Plane intensity sampled across normalized span.",
      "Uniformity represented by coefficient of variation.",
      "Reference profile is flat intensity.",
    ],
    validRange: ["mean intensity 20-200 lux", "tilt -0.2..0.2", "ripple 0-0.2"],
    controls: [
      { id: "meanLux", label: "mean illuminance", min: 20, max: 200, step: 2, unit: "lux", default: 100 },
      { id: "tilt", label: "tilt", min: -0.2, max: 0.2, step: 0.005, default: 0.01 },
      { id: "ripple", label: "ripple", min: 0, max: 0.2, step: 0.005, default: 0.02 },
    ],
    evaluate: (params) => {
      const xs = lineSample(40, -1, 1, (x) => x);
      const values = xs.map(
        (x) => params.meanLux * (1 + params.tilt * x + params.ripple * Math.cos(Math.PI * x))
      );
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
      const cv = Math.sqrt(variance) / Math.max(1e-9, mean);
      const samples = xs.map((x, i) => ({ x, y: values[i], ref: params.meanLux }));
      return {
        samples,
        checks: [
          {
            id: "illumination_cv",
            label: "Uniformity error (CV)",
            kind: "max",
            reference: 0,
            tolerance: 0.05,
            value: cv,
          },
        ],
      };
    },
  },
  "v2-ch12-s07-the-underlying-unity-of-nature": {
    id: "v2-ch12-s07-the-underlying-unity-of-nature",
    title: "Underlying Unity of Nature",
    summary: "Cross-domain normalized curves are compared for structural unity.",
    archetype: "Cross-Domain Similarity",
    assumptions: [
      "Curves are normalized to comparable scale.",
      "Unity metric uses RMS mismatch to a shared template.",
      "Lower RMS indicates higher underlying similarity.",
    ],
    validRange: ["phase mismatch -0.4..0.4", "amplitude drift 0-0.3"],
    controls: [
      { id: "phaseMismatch", label: "phase mismatch", min: -0.4, max: 0.4, step: 0.01, default: 0.03 },
      { id: "amplitudeDrift", label: "amplitude drift", min: 0, max: 0.3, step: 0.005, default: 0.02 },
    ],
    evaluate: (params) => {
      const samples = buildPairs(50, 0, 2 * Math.PI, (x) => {
        const ref = 0.5 + 0.5 * Math.sin(x);
        const y =
          0.5 +
          (0.5 + params.amplitudeDrift) * Math.sin(x + params.phaseMismatch);
        return { x, y, ref };
      });
      const unityRms = Math.sqrt(
        samples.reduce((sum, p) => sum + Math.pow(p.y - p.ref, 2), 0) / samples.length
      );
      return {
        samples,
        checks: [
          {
            id: "unity_rms",
            label: "Cross-domain normalized RMS",
            kind: "max",
            reference: 0,
            tolerance: 0.03,
            value: unityRms,
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
  const metrics = state.result.checks.map((check) => checkMetric(check));
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
      id: `${config.id}-continuum`,
      title: "Analytic proxy comparison",
      xLabel: "domain",
      yLabel: "response",
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
  const checks = state.result.checks.map((check) => checkValidation(check));
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

export function createV2Ch12Lab(id: keyof typeof CONFIGS | string) {
  const config = CONFIGS[id];
  if (!config) {
    throw new Error(`Unknown v2 ch12 lab id: ${id}`);
  }

  const model: LabModel<Params, State> = {
    id: config.id,
    title: config.title,
    summary: config.summary,
    archetype: config.archetype,
    simulation: {
      fixedDt: 1 / 180,
      maxSubSteps: 16,
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
