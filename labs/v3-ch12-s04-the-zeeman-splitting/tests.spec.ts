import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3-ch12-s04-the-zeeman-splitting", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "slopeScale": 1,
  "noise": 0.01
});
    expect(metricValue(metrics, "zeeman_r2")).toBeGreaterThanOrEqual(0.99);
    expect(metricValue(metrics, "zeeman_slope_error")).toBeLessThanOrEqual(0.03);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "slopeScale": 1,
  "noise": 0.01
});
    const stressed = computeMetrics({
  "slopeScale": 1.15,
  "noise": 0.18
});
    expect(metricValue(stressed, "zeeman_slope_error")).toBeGreaterThan(metricValue(baseline, "zeeman_slope_error"));
  });
});
