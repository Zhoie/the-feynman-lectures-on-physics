import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch01-s01 calibration", () => {
  it("keeps relativistic model residual low in formula truth mode", () => {
    const metrics = computeMetrics({
      vMax: 0.9,
      noise: 0,
      modelType: 1,
      benchmarkMode: 0,
    });
    expect(metricValue(metrics, "rms")).toBeLessThan(5e-3);
  });

  it("shows constant model residual above relativistic model at high speed", () => {
    const classic = computeMetrics({
      vMax: 0.9,
      noise: 0,
      modelType: 0,
      benchmarkMode: 0,
    });
    const relativistic = computeMetrics({
      vMax: 0.9,
      noise: 0,
      modelType: 1,
      benchmarkMode: 0,
    });
    expect(metricValue(classic, "rms")).toBeGreaterThan(metricValue(relativistic, "rms"));
  });
});
