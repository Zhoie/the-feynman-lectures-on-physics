import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s04-momentum-and-energy", () => {
  it("keeps windowed Kpost/Kpre near 1 for elastic calibration preset", () => {
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

  it("shows energy loss when restitution and dissipation are reduced", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 0.4,
      restitutionSlope: 0.06,
      lossCoeff: 0.08,
    });
    expect(metricValue(metrics, "energy_window_ratio")).toBeLessThan(0.9);
  });
});
