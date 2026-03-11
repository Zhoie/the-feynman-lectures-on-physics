import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch12-s01-what-is-a-force", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "mass": 1.5,
  "force": 12,
  "sensorBias": 0
});
    expect(metricValue(metrics, "force_law_error")).toBeLessThanOrEqual(0.02);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "mass": 1.5,
  "force": 12,
  "sensorBias": 0
});
    const stressed = computeMetrics({
  "mass": 1.5,
  "force": 12,
  "sensorBias": 0.06
});
    expect(metricValue(stressed, "force_law_error")).toBeGreaterThan(metricValue(baseline, "force_law_error"));
  });
});
