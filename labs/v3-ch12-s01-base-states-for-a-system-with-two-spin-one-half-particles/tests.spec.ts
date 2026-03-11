import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "leakage": 0
});
    expect(metricValue(metrics, "orthonormal_error")).toBeLessThanOrEqual(1e-8);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "leakage": 0
});
    const stressed = computeMetrics({
  "leakage": 0.0008
});
    expect(metricValue(stressed, "orthonormal_error")).toBeGreaterThan(metricValue(baseline, "orthonormal_error"));
  });
});
