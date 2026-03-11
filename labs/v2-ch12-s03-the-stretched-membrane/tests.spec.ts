import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s03-the-stretched-membrane", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "amplitude": 1,
  "boundaryDrift": 0
});
    expect(metricValue(metrics, "boundary_residual")).toBeLessThanOrEqual(0.001);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "amplitude": 1,
  "boundaryDrift": 0
});
    const stressed = computeMetrics({
  "amplitude": 1,
  "boundaryDrift": 0.008
});
    expect(metricValue(stressed, "boundary_residual")).toBeGreaterThan(metricValue(baseline, "boundary_residual"));
  });
});
