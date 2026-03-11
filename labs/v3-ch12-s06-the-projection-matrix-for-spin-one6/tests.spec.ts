import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3-ch12-s06-the-projection-matrix-for-spin-one6", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "leakage": 0
});
    expect(metricValue(metrics, "projection_error")).toBeLessThanOrEqual(1e-8);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "leakage": 0
});
    const stressed = computeMetrics({
  "leakage": 0.0007
});
    expect(metricValue(stressed, "projection_error")).toBeGreaterThan(metricValue(baseline, "projection_error"));
  });
});
