import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s02 calibration", () => {
  it("keeps isolated normalized momentum drift within 1%", () => {
    const metrics = computeMetrics({
      mass1: 1.2,
      mass2: 2.1,
      v1: 0.7,
      v2: -0.2,
      restitution: 0.9,
      pulseForce: 0,
      pulseDuration: 0,
      rollingMu: 0,
      slopeDeg: 0,
      viscousCoeff: 0,
    });
    expect(metricValue(metrics, "drift")).toBeLessThanOrEqual(0.01);
  });

  it("enforces forced-mode drift above isolated baseline", () => {
    const isolated = computeMetrics({
      mass1: 1.2,
      mass2: 2.1,
      v1: 0.7,
      v2: -0.2,
      restitution: 0.9,
      pulseForce: 0,
      pulseDuration: 0,
    });
    const forced = computeMetrics({
      mass1: 1.2,
      mass2: 2.1,
      v1: 0.7,
      v2: -0.2,
      restitution: 0.9,
      pulseForce: 4.5,
      pulseDuration: 0.18,
    });
    expect(metricValue(forced, "drift")).toBeGreaterThan(metricValue(isolated, "drift") + 0.01);
  });

  it("stays within dataset residual envelope", () => {
    const metrics = computeMetrics({
      mass1: 0.9,
      mass2: 1.4,
      v1: 0.5,
      v2: -0.1,
      restitution: 0.94,
      pulseForce: 0,
      pulseDuration: 0,
    });
    expect(metricValue(metrics, "dataset_residual_sigma")).toBeLessThanOrEqual(2);
  });
});
