import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s02-conservation-of-momentum", () => {
  it("keeps momentum drift low in isolated track mode", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 2,
      v1: 0.6,
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

  it("shows clear drift increase under finite external pulse", () => {
    const isolated = computeMetrics({
      mass1: 1,
      mass2: 2,
      v1: 0.6,
      v2: -0.2,
      restitution: 0.9,
      pulseForce: 0,
      pulseDuration: 0,
    });
    const forced = computeMetrics({
      mass1: 1,
      mass2: 2,
      v1: 0.6,
      v2: -0.2,
      restitution: 0.9,
      pulseForce: 4.0,
      pulseDuration: 0.2,
    });
    expect(metricValue(forced, "drift")).toBeGreaterThan(metricValue(isolated, "drift") + 0.01);
  });
});
