import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "diffusivity": 0.7,
  "sourceDistance": 0.8,
  "time": 0.8,
  "boundaryBias": 0
});
    expect(metricValue(metrics, "boundary_error")).toBeLessThanOrEqual(0.02);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "diffusivity": 0.7,
  "sourceDistance": 0.8,
  "time": 0.8,
  "boundaryBias": 0
});
    const stressed = computeMetrics({
  "diffusivity": 0.7,
  "sourceDistance": 0.8,
  "time": 0.8,
  "boundaryBias": 0.04
});
    expect(metricValue(stressed, "boundary_error")).toBeGreaterThan(metricValue(baseline, "boundary_error"));
  });
});
