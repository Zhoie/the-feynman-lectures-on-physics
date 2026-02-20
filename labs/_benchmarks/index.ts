import type {
  MetricValue,
  ModelSource,
  ValidationCheck,
  ValidationResult,
} from "@/features/labs/types";
import { benchmarkSources } from "./sources";

export function getBenchmarkSources(labId: string): ModelSource[] {
  return benchmarkSources[labId] ?? [];
}

function toStatus(delta: number, tolerance: number): "ok" | "warn" | "fail" {
  if (!Number.isFinite(delta)) return "fail";
  if (delta <= tolerance) return "ok";
  if (delta <= tolerance * 2) return "warn";
  return "fail";
}

export function numericCheck(
  id: string,
  label: string,
  value: number,
  reference: number,
  tolerance: number,
  message?: string
): ValidationCheck {
  const delta = Math.abs(value - reference);
  return {
    id,
    label,
    value,
    reference,
    tolerance,
    status: toStatus(delta, tolerance),
    message,
  };
}

export function statusFromChecks(
  checks: ValidationCheck[],
  warnings: string[] = []
): ValidationResult {
  const status = checks.some((check) => check.status === "fail")
    ? "fail"
    : checks.some((check) => check.status === "warn")
      ? "warn"
      : "ok";
  return { status, checks, warnings };
}

export function decorateMetric(
  metric: MetricValue,
  reference: number,
  tolerance: number
): MetricValue {
  if (typeof metric.value !== "number") return metric;
  const delta = Math.abs(metric.value - reference);
  return {
    ...metric,
    reference,
    tolerance,
    status: toStatus(delta, tolerance),
  };
}
