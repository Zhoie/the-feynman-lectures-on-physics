import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s04 calibration", () => {
  it("keeps momentum drift below 1% in isolated setup", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 0.9,
      restitutionSlope: 0.03,
      lossCoeff: 0.03,
    });
    expect(metricValue(metrics, "momentum_drift_norm")).toBeLessThanOrEqual(0.01);
  });

  it("passes the elastic 0.95-1.05 energy gate", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 1,
      restitutionSlope: 0,
      lossCoeff: 0,
    });
    const ratio = metricValue(metrics, "energy_window_ratio");
    expect(ratio).toBeGreaterThanOrEqual(0.95);
    expect(ratio).toBeLessThanOrEqual(1.05);
  });

  it("stays inside dataset residual threshold", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.2,
      v1: 0.7,
      v2: -0.3,
      restitution: 0.85,
      restitutionSlope: 0.03,
      lossCoeff: 0.03,
    });
    expect(metricValue(metrics, "dataset_residual_sigma")).toBeLessThanOrEqual(2);
  });

  it("keeps Kpost/Kpre monotonic with restitution setting", () => {
    const low = computeMetrics({
      mass1: 1,
      mass2: 1.2,
      v1: 0.7,
      v2: -0.3,
      restitution: 0.4,
      restitutionSlope: 0.03,
      lossCoeff: 0.03,
    });
    const mid = computeMetrics({
      mass1: 1,
      mass2: 1.2,
      v1: 0.7,
      v2: -0.3,
      restitution: 0.7,
      restitutionSlope: 0.03,
      lossCoeff: 0.03,
    });
    const high = computeMetrics({
      mass1: 1,
      mass2: 1.2,
      v1: 0.7,
      v2: -0.3,
      restitution: 0.95,
      restitutionSlope: 0.03,
      lossCoeff: 0.03,
    });
    expect(metricValue(mid, "energy_window_ratio")).toBeGreaterThan(
      metricValue(low, "energy_window_ratio")
    );
    expect(metricValue(high, "energy_window_ratio")).toBeGreaterThan(
      metricValue(mid, "energy_window_ratio")
    );
  });
});
