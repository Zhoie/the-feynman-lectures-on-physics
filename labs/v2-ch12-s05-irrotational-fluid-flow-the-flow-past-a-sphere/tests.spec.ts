import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "radius": 1,
  "freeSpeed": 1.3,
  "surfaceBias": 0
});
    expect(metricValue(metrics, "normal_velocity_residual")).toBeLessThanOrEqual(0.02);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "radius": 1,
  "freeSpeed": 1.3,
  "surfaceBias": 0
});
    const stressed = computeMetrics({
  "radius": 1,
  "freeSpeed": 1.3,
  "surfaceBias": 0.04
});
    expect(metricValue(stressed, "normal_velocity_residual")).toBeGreaterThan(metricValue(baseline, "normal_velocity_residual"));
  });
});
