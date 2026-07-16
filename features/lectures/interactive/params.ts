import type { ModuleParameter } from "./types";

export function normalizeParameterValue(
  param: ModuleParameter,
  value: number,
  fallback: number
) {
  const safeFallback = Number.isFinite(fallback) ? fallback : param.min;
  const finiteValue = Number.isFinite(value) ? value : safeFallback;
  return Math.min(param.max, Math.max(param.min, finiteValue));
}

export function parameterPrecision(step: number) {
  if (!Number.isFinite(step) || step >= 1) return 0;
  const value = step.toString().toLowerCase();
  if (value.includes("e-")) {
    return Math.min(6, Number(value.split("e-")[1]) || 0);
  }
  return Math.min(6, value.split(".")[1]?.length ?? 0);
}
