import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3-ch12-s05-the-states-in-a-magnetic-field", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "field": 1.4,
  "drift": 0.0002
});
    expect(metricValue(metrics, "norm_drift")).toBeLessThanOrEqual(0.001);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "field": 1.4,
  "drift": 0.0002
});
    const stressed = computeMetrics({
  "field": 1.4,
  "drift": 0.008
});
    expect(metricValue(stressed, "norm_drift")).toBeGreaterThan(metricValue(baseline, "norm_drift"));
  });
});
