import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch12-s04-fundamental-forces-fields", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "strength": 10,
  "distanceScale": 1.2,
  "slopeBias": 0
});
    expect(metricValue(metrics, "inverse_square_residual")).toBeLessThanOrEqual(0.05);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "strength": 10,
  "distanceScale": 1.2,
  "slopeBias": 0
});
    const stressed = computeMetrics({
  "strength": 10,
  "distanceScale": 1.2,
  "slopeBias": 0.15
});
    expect(metricValue(stressed, "inverse_square_residual")).toBeGreaterThan(metricValue(baseline, "inverse_square_residual"));
  });
});
