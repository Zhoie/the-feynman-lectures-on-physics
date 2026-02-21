import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s01-newton-s-third-law", () => {
  it("keeps true action-reaction balance near zero", () => {
    const metrics = computeMetrics({
      mass2: 1.5,
      stretch: 0.12,
      sensorNoise: 0,
      sensorOffset: 0,
    });
    expect(Math.abs(metricValue(metrics, "true_force_balance"))).toBeLessThan(1e-4);
  });

  it("keeps measured force-pair residual within calibrated tolerance", () => {
    const metrics = computeMetrics({
      mass2: 2.6,
      stretch: 0.16,
      sensorHz: 160,
      sensorSmoothing: 0.24,
      sensorNoise: 0.02,
    });
    expect(metricValue(metrics, "measured_force_balance_norm")).toBeLessThanOrEqual(0.02);
  });
});
