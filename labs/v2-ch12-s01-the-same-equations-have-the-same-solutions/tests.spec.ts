import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s01-the-same-equations-have-the-same-solutions", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "amplitude": 1,
  "decay": 0.8,
  "offset": 0
});
    expect(metricValue(metrics, "shape_overlap")).toBeGreaterThanOrEqual(0.97);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "amplitude": 1,
  "decay": 0.8,
  "offset": 0
});
    const stressed = computeMetrics({
  "amplitude": 1,
  "decay": 0.8,
  "offset": 0.08
});
    expect(metricValue(stressed, "shape_overlap")).toBeLessThan(metricValue(baseline, "shape_overlap"));
  });
});
