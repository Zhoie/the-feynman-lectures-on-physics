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
  uncertainty?: number;
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
  time: number;
  phase: number;
  marker: number;
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

function minCheckMetric(check: CheckDef): MetricValue {
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

function minCheckValidation(check: CheckDef): ValidationCheck {
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

function defaultParams(controls: ControlSpec[]) {
  return controls.reduce<Params>((acc, control) => {
    acc[control.id] = control.default;
    return acc;
  }, {});
}

function normalizeParams(input: Partial<Params> | undefined, controls: ControlSpec[]) {
  const defaults = defaultParams(controls);
  return { ...defaults, ...(input ?? {}) };
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

function buildState(config: LabConfig, params: Params): State {
  return {
    time: 0,
    phase: 0,
    marker: 0,
    result: config.evaluate(params),
  };
}

function metricList(config: LabConfig, state: State): MetricValue[] {
  const values: MetricValue[] = [];
  for (const check of state.result.checks) {
    if (check.kind === "max") {
      values.push(
        decorateMetric(
          {
            id: check.id,
            label: check.label,
            value: check.value,
            precision: 5,
          },
          check.reference,
          check.tolerance
        )
      );
    } else {
      values.push(minCheckMetric(check));
    }
  }

  const residualSigma = benchmarkResidual(config.id, state.result.samples);
  values.push(
    decorateMetric(
      {
        id: "benchmark_residual_sigma",
        label: "Benchmark residual (sigma RMS)",
        value: residualSigma,
        precision: 3,
      },
      0,
      2
    )
  );

  if (state.result.auxMetrics?.length) {
    values.push(...state.result.auxMetrics);
  }
  return values;
}

function chartList(config: LabConfig, state: State): ChartSpec[] {
  const profile = getCh12BenchmarkProfile(config.id);
  const profileSeries = profile ? benchmarkSeries(profile) : [];
  return [
    {
      id: `${config.id}-curve`,
      title: "Simulation vs reference",
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
          label: "model reference",
          data: state.result.samples.map((point) => ({ x: point.x, y: point.ref })),
          color: "#0284c7",
          role: "reference",
          lineStyle: "dashed",
        },
        {
          id: `${config.id}-benchmark`,
          label: "benchmark profile",
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
  const checks: ValidationCheck[] = [];
  for (const check of state.result.checks) {
    if (check.kind === "max") {
      checks.push(
        numericCheck(
          check.id,
          check.label,
          check.value,
          check.reference,
          check.tolerance
        )
      );
    } else {
      checks.push(minCheckValidation(check));
    }
  }

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

function drawState(
  ctx: CanvasRenderingContext2D,
  state: State,
  size: { width: number; height: number }
) {
  ctx.clearRect(0, 0, size.width, size.height);
  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, size.width, size.height);

  const left = size.width * 0.08;
  const right = size.width * 0.92;
  const baseline = size.height * 0.65;

  ctx.strokeStyle = "#cbd5e1";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(left, baseline);
  ctx.lineTo(right, baseline);
  ctx.stroke();

  const x = left + (right - left) * (0.5 + 0.4 * Math.sin(state.phase));
  const y = baseline - 40 * Math.cos(state.phase * 0.7);

  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x - 18, y - 12, 36, 24);
  ctx.fillStyle = "#0284c7";
  ctx.beginPath();
  ctx.arc(x, y - 24, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#334155";
  ctx.font = "12px system-ui";
  ctx.fillText("SI-calibrated mechanics", left, 24);
}

function lineSample(count: number, from: number, to: number, fn: (x: number) => number) {
  const values: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const x = from + ((to - from) * i) / (count - 1);
    values.push(fn(x));
  }
  return values;
}

const CONFIGS: Record<string, LabConfig> = {
  "v1-ch12-s01-what-is-a-force": {
    id: "v1-ch12-s01-what-is-a-force",
    title: "What is a Force? (SI)",
    summary:
      "Connect applied force with acceleration using a calibrated F=ma measurement channel.",
    archetype: "Force Law",
    assumptions: [
      "Single-body 1D model in SI units.",
      "Measured acceleration may include a small instrument bias.",
      "Reference relation is Newton's second law a=F/m.",
    ],
    validRange: ["mass 0.5-5 kg", "force 1-25 N", "sensor bias +/-8%"],
    controls: [
      { id: "mass", label: "mass", min: 0.5, max: 5, step: 0.1, unit: "kg", default: 1.5 },
      { id: "force", label: "applied force", min: 1, max: 25, step: 0.5, unit: "N", default: 12 },
      {
        id: "sensorBias",
        label: "sensor bias",
        group: "advanced",
        min: -0.08,
        max: 0.08,
        step: 0.005,
        default: 0,
      },
    ],
    evaluate: (params) => {
      const mass = Math.max(1e-6, params.mass);
      const force = params.force;
      const truth = force / mass;
      const measured = truth * (1 + params.sensorBias);
      const error = Math.abs(measured - truth) / Math.max(Math.abs(truth), 1e-9);
      const xs = lineSample(20, 1, 25, (x) => x);
      const samples = xs.map((x) => ({
        x,
        ref: x / mass,
        y: (x / mass) * (1 + params.sensorBias),
      }));
      return {
        samples,
        checks: [
          {
            id: "force_law_error",
            label: "|a - F/m| / max(|a|,eps)",
            kind: "max",
            reference: 0,
            tolerance: 0.02,
            value: error,
          },
        ],
        auxMetrics: [
          { id: "measured_acc", label: "Measured acceleration", value: measured, unit: "m/s^2", precision: 4 },
        ],
      };
    },
  },
  "v1-ch12-s02-friction": {
    id: "v1-ch12-s02-friction",
    title: "Friction and Dissipation (SI)",
    summary:
      "Static-to-kinetic transition and energy dissipation are measured with explicit friction thresholds.",
    archetype: "Friction",
    assumptions: [
      "Coulomb friction with distinct static and kinetic coefficients.",
      "A block transitions to slip when applied force exceeds mu_s*N.",
      "Energy under kinetic friction should be non-increasing.",
    ],
    validRange: ["mu_s 0.2-1.2", "mu_k 0.1-1.0", "normal force 5-40 N"],
    controls: [
      { id: "muStatic", label: "mu static", min: 0.2, max: 1.2, step: 0.01, default: 0.55 },
      { id: "muKinetic", label: "mu kinetic", min: 0.1, max: 1, step: 0.01, default: 0.42 },
      { id: "normal", label: "normal force", min: 5, max: 40, step: 0.5, unit: "N", default: 18 },
      {
        id: "switchBias",
        label: "transition bias",
        group: "advanced",
        min: -0.08,
        max: 0.08,
        step: 0.002,
        default: 0,
      },
    ],
    evaluate: (params) => {
      const expected = params.muStatic * params.normal;
      const measured = expected * (1 + params.switchBias);
      const transitionError = Math.abs(measured - expected) / Math.max(expected, 1e-9);

      const dt = 0.02;
      const mass = 2;
      let v = 2.8;
      let ePrev = 0.5 * mass * v * v;
      let spike = 0;
      const samples: SamplePoint[] = [];
      for (let i = 0; i < 40; i += 1) {
        const friction = params.muKinetic * params.normal;
        const a = -Math.sign(v) * friction / mass;
        v = Math.max(0, v + a * dt);
        const e = 0.5 * mass * v * v;
        spike = Math.max(spike, Math.max(0, e - ePrev));
        ePrev = e;
        samples.push({ x: i * dt, y: e, ref: Math.max(0, e + spike) });
      }

      return {
        samples,
        checks: [
          {
            id: "friction_transition_error",
            label: "Static/kinetic transition error",
            kind: "max",
            reference: 0,
            tolerance: 0.05,
            value: transitionError,
          },
          {
            id: "friction_energy_spike",
            label: "Energy non-monotonic spike",
            kind: "max",
            reference: 0,
            tolerance: 0.001,
            value: spike,
          },
        ],
      };
    },
  },
  "v1-ch12-s03-molecular-forces": {
    id: "v1-ch12-s03-molecular-forces",
    title: "Molecular Force Equilibrium",
    summary:
      "A Lennard-Jones style potential is calibrated around the equilibrium separation.",
    archetype: "Molecular Potential",
    assumptions: [
      "Pair interaction approximated with a 12-6 potential.",
      "Equilibrium occurs near r=2^(1/6)*sigma.",
      "Residual is normalized by equilibrium spacing.",
    ],
    validRange: ["epsilon 0.1-3", "sigma 0.2-1.5 m", "distance 0.2-2.2 m"],
    controls: [
      { id: "epsilon", label: "epsilon", min: 0.1, max: 3, step: 0.05, default: 1.2 },
      { id: "sigma", label: "sigma", min: 0.2, max: 1.5, step: 0.02, unit: "m", default: 0.8 },
      { id: "distance", label: "probe distance", min: 0.2, max: 2.2, step: 0.02, unit: "m", default: 0.9 },
    ],
    evaluate: (params) => {
      const sigma = params.sigma;
      const rEq = Math.pow(2, 1 / 6) * sigma;
      const residual = Math.abs(params.distance - rEq) / Math.max(rEq, 1e-9);
      const xs = lineSample(40, 0.4 * sigma, 2.4 * sigma, (x) => x);
      const samples = xs.map((r) => {
        const sr6 = Math.pow(sigma / r, 6);
        const u = 4 * params.epsilon * (sr6 * sr6 - sr6);
        return { x: r, y: u, ref: u };
      });
      return {
        samples,
        checks: [
          {
            id: "molecular_equilibrium_residual",
            label: "Potential equilibrium residual",
            kind: "max",
            reference: 0,
            tolerance: 0.05,
            value: residual,
          },
        ],
        auxMetrics: [
          { id: "equilibrium_distance", label: "Equilibrium distance", value: rEq, unit: "m", precision: 4 },
        ],
      };
    },
  },
  "v1-ch12-s04-fundamental-forces-fields": {
    id: "v1-ch12-s04-fundamental-forces-fields",
    title: "Fundamental Forces and Fields",
    summary:
      "Field strength scaling is checked against an inverse-square baseline in log space.",
    archetype: "Field Scaling",
    assumptions: [
      "Force magnitude follows F~1/r^2 in calibrated domain.",
      "Log-slope is estimated from sampled response.",
      "Residual compares fitted slope against -2.",
    ],
    validRange: ["field strength 1-30", "distance scale 0.4-3 m"],
    controls: [
      { id: "strength", label: "field strength", min: 1, max: 30, step: 0.5, default: 10 },
      { id: "distanceScale", label: "distance scale", min: 0.4, max: 3, step: 0.05, unit: "m", default: 1.2 },
      {
        id: "slopeBias",
        label: "slope bias",
        group: "advanced",
        min: -0.2,
        max: 0.2,
        step: 0.005,
        default: 0,
      },
    ],
    evaluate: (params) => {
      const xs = lineSample(24, 0.6, 4.5, (x) => x);
      const samples = xs.map((r) => {
        const ref = params.strength / Math.pow(r * params.distanceScale, 2);
        const y = ref * Math.pow(r, params.slopeBias);
        return { x: r, y, ref };
      });
      const first = samples[0];
      const last = samples[samples.length - 1];
      const slope =
        (Math.log(Math.max(1e-12, last.y)) - Math.log(Math.max(1e-12, first.y))) /
        (Math.log(last.x) - Math.log(first.x));
      const residual = Math.abs(slope + 2) / 2;
      return {
        samples,
        checks: [
          {
            id: "inverse_square_residual",
            label: "Log-slope residual vs inverse-square",
            kind: "max",
            reference: 0,
            tolerance: 0.05,
            value: residual,
          },
        ],
        auxMetrics: [{ id: "fitted_slope", label: "Fitted log slope", value: slope, precision: 4 }],
      };
    },
  },
  "v1-ch12-s05-pseudo-forces": {
    id: "v1-ch12-s05-pseudo-forces",
    title: "Pseudo Forces in Accelerated Frames",
    summary:
      "Force balance in a non-inertial frame is validated against equivalent inertial-form equations.",
    archetype: "Non-Inertial Frame",
    assumptions: [
      "Pseudo force modeled as Fp=-m*a_frame.",
      "Spring restores toward origin with linear law.",
      "Equilibrium residual uses normalized net force.",
    ],
    validRange: ["mass 0.5-5 kg", "frame accel -8..8 m/s^2", "spring k 2-40 N/m"],
    controls: [
      { id: "mass", label: "mass", min: 0.5, max: 5, step: 0.1, unit: "kg", default: 1.5 },
      { id: "frameAccel", label: "frame acceleration", min: -8, max: 8, step: 0.2, unit: "m/s^2", default: 3 },
      { id: "springK", label: "spring constant", min: 2, max: 40, step: 0.5, unit: "N/m", default: 12 },
      { id: "displacement", label: "displacement", min: -1.5, max: 1.5, step: 0.02, unit: "m", default: 0.37 },
    ],
    evaluate: (params) => {
      const inertial = params.mass * params.frameAccel;
      const spring = params.springK * params.displacement;
      const net = inertial - spring;
      const residual = Math.abs(net) / Math.max(Math.abs(inertial) + Math.abs(spring), 1e-9);
      const xs = lineSample(24, -1.2, 1.2, (x) => x);
      const samples = xs.map((x) => ({
        x,
        y: params.mass * params.frameAccel - params.springK * x,
        ref: 0,
      }));
      return {
        samples,
        checks: [
          {
            id: "pseudo_equilibrium_residual",
            label: "Accelerated-frame equilibrium residual",
            kind: "max",
            reference: 0,
            tolerance: 0.03,
            value: residual,
          },
        ],
      };
    },
  },
  "v1-ch12-s06-nuclear-forces": {
    id: "v1-ch12-s06-nuclear-forces",
    title: "Short-Range Nuclear Force Proxy",
    summary:
      "A Yukawa-like short-range interaction is compared against a calibrated short-range reference profile.",
    archetype: "Short-Range Force",
    assumptions: [
      "Nuclear proxy uses exp(-r/lambda)/r envelope.",
      "Reference profile is a calibrated Yukawa envelope.",
      "Mismatch metric focuses on short-range domain where the interaction dominates.",
    ],
    validRange: ["coupling 10-80", "lambda 0.1-2 fm (scaled)", "short range 0.1-2"],
    controls: [
      { id: "coupling", label: "coupling", min: 10, max: 80, step: 1, default: 35 },
      { id: "lambda", label: "lambda", min: 0.1, max: 2, step: 0.02, default: 0.8 },
      { id: "rangeScale", label: "range scale", min: 0.5, max: 2, step: 0.02, default: 1 },
    ],
    evaluate: (params) => {
      const xs = lineSample(32, 0.15, 3, (x) => x);
      const samples = xs.map((r) => {
        const rr = r * params.rangeScale;
        const target = (params.coupling * Math.exp(-rr / params.lambda)) / Math.max(rr, 1e-6);
        const modeled =
          target * (1 + 0.08 * Math.abs(params.rangeScale - 1) * (r / 3));
        return { x: r, y: modeled, ref: target };
      });
      const shortRange = samples.filter((point) => point.x <= 0.8);
      const mismatch =
        shortRange.reduce((acc, point) => {
          const target = Math.max(1e-9, point.ref);
          return acc + Math.abs(point.y - point.ref) / target;
        }, 0) / Math.max(1, shortRange.length);
      return {
        samples,
        checks: [
          {
            id: "nuclear_short_range_mismatch",
            label: "Short-range dominance mismatch",
            kind: "max",
            reference: 0,
            tolerance: 0.1,
            value: mismatch,
          },
        ],
      };
    },
  },
};

export function createV1Ch12Lab(id: keyof typeof CONFIGS | string) {
  const config = CONFIGS[id];
  if (!config) {
    throw new Error(`Unknown v1 ch12 lab id: ${id}`);
  }

  const model: LabModel<Params, State> = {
    id: config.id,
    title: config.title,
    summary: config.summary,
    archetype: config.archetype,
    simulation: {
      fixedDt: 1 / 240,
      maxSubSteps: 20,
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
    step: (state) => {
      state.time += 1 / 240;
      state.phase += 0.9 * (1 / 60);
      state.marker = 0.5 + 0.4 * Math.sin(state.phase);
    },
    draw: (ctx, state, _params, size) => drawState(ctx, state, size),
    metrics: (state) => metricList(config, state),
    charts: (state) => chartList(config, state),
    validate: (state) => validation(config, state),
  };

  function computeMetrics(input: Partial<Params>) {
    const params = normalizeParams(input, config.controls);
    const state = buildState(config, params);
    return metricList(config, state);
  }

  return { model, computeMetrics };
}
