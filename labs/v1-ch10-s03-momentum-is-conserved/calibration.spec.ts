import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s03 calibration", () => {
  it("keeps pre-wall momentum drift below 1%", () => {
    const metrics = computeMetrics({ mass: 1.6, releaseImpulse: 0.3, releaseDuration: 0.08 });
    expect(metricValue(metrics, "momentum_drift_norm")).toBeLessThanOrEqual(0.01);
  });

  it("keeps center-of-mass drift below 0.5% track length", () => {
    const metrics = computeMetrics({
      mass: 1.2,
      releaseImpulse: 0.3,
      releaseDuration: 0.08,
      asymmetry: 0,
      fixtureFriction: 0,
    });
    expect(metricValue(metrics, "com_drift_norm")).toBeLessThanOrEqual(0.005);
  });

  it("stays within benchmark residual threshold", () => {
    const metrics = computeMetrics({ mass: 1.0, releaseImpulse: 0.25, releaseDuration: 0.07 });
    expect(metricValue(metrics, "dataset_residual_sigma")).toBeLessThanOrEqual(2);
  });

  it("keeps energy ratio in the observation window near unity", () => {
    const metrics = computeMetrics({ mass: 1.0, releaseImpulse: 0.24, releaseDuration: 0.08 });
    expect(metricValue(metrics, "energy_window_ratio")).toBeGreaterThanOrEqual(0.95);
    expect(metricValue(metrics, "energy_window_ratio")).toBeLessThanOrEqual(1.05);
  });
});
