import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "offdiag": 1.5,
  "asymmetry": 0
});
    expect(metricValue(metrics, "hermitian_residual")).toBeLessThanOrEqual(1e-10);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "offdiag": 1.5,
  "asymmetry": 0
});
    const stressed = computeMetrics({
  "offdiag": 1.5,
  "asymmetry": 8e-9
});
    expect(metricValue(stressed, "hermitian_residual")).toBeGreaterThan(metricValue(baseline, "hermitian_residual"));
  });
});
