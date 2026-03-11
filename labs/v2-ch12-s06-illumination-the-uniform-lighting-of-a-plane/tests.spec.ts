import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "meanLux": 100,
  "tilt": 0.01,
  "ripple": 0.02
});
    expect(metricValue(metrics, "illumination_cv")).toBeLessThanOrEqual(0.05);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "meanLux": 100,
  "tilt": 0.01,
  "ripple": 0.02
});
    const stressed = computeMetrics({
  "meanLux": 100,
  "tilt": 0.16,
  "ripple": 0.18
});
    expect(metricValue(stressed, "illumination_cv")).toBeGreaterThan(metricValue(baseline, "illumination_cv"));
  });
});
