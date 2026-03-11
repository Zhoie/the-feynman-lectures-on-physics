import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch12-s06-nuclear-forces", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "coupling": 35,
  "lambda": 0.8,
  "rangeScale": 1
});
    expect(metricValue(metrics, "nuclear_short_range_mismatch")).toBeLessThanOrEqual(0.1);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "coupling": 35,
  "lambda": 0.8,
  "rangeScale": 1
});
    const stressed = computeMetrics({
  "coupling": 35,
  "lambda": 0.8,
  "rangeScale": 1.8
});
    expect(metricValue(stressed, "nuclear_short_range_mismatch")).toBeGreaterThan(metricValue(baseline, "nuclear_short_range_mismatch"));
  });
});
