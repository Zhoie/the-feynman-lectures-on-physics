import type { ControlSpec, MetricValue } from "../types";

export function normalizeLabControlValue(
  param: ControlSpec,
  value: number,
  fallback = param.default
) {
  const safeFallback = Number.isFinite(fallback) ? fallback : 0;
  const finiteValue = Number.isFinite(value) ? value : safeFallback;

  if (param.type === "select" && param.options?.length) {
    return param.options.some((option) => option.value === finiteValue)
      ? finiteValue
      : param.options.some((option) => option.value === safeFallback)
        ? safeFallback
        : param.options[0].value;
  }

  const minimum = Number.isFinite(param.min) ? (param.min as number) : -Infinity;
  const maximum = Number.isFinite(param.max) ? (param.max as number) : Infinity;
  return Math.min(maximum, Math.max(minimum, finiteValue));
}

export function createDefaultLabParams(params: ControlSpec[]) {
  return params.reduce<Record<string, number>>((values, param) => {
    const fallback = param.options?.[0]?.value ?? 0;
    values[param.id] = normalizeLabControlValue(
      param,
      param.default,
      fallback
    );
    return values;
  }, {});
}

export function controlPrecision(step?: number) {
  if (!step || !Number.isFinite(step) || step >= 1) return 0;
  const value = step.toString().toLowerCase();
  if (value.includes("e-")) {
    return Math.min(6, Number(value.split("e-")[1]) || 0);
  }
  return Math.min(6, value.split(".")[1]?.length ?? 0);
}

export function formatMetricValue(metric: MetricValue) {
  if (typeof metric.value !== "number") return `${metric.value}`;
  if (!Number.isFinite(metric.value)) return "Unavailable";
  const precision = metric.precision ?? 3;
  const absolute = Math.abs(metric.value);
  if (absolute >= 1e4 || (absolute > 0 && absolute < 1e-3)) {
    return metric.value.toExponential(Math.min(4, Math.max(1, precision)));
  }
  const fixed = metric.value.toFixed(precision);
  return Number(fixed) === 0 ? (0).toFixed(precision) : fixed;
}
