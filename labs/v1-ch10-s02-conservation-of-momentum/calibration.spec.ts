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
  it("maintains low normalized drift in isolated case", () => {
    const metrics = computeMetrics({
      mass1: 1.2,
      mass2: 2.1,
      v1: 0.7,
      v2: -0.2,
      restitution: 0.9,
      externalForce: 0,
    });
    expect(metricValue(metrics, "drift")).toBeLessThan(1e-2);
  });

  it("shows higher drift when external force is applied", () => {
    const isolated = computeMetrics({
      mass1: 1.2,
      mass2: 2.1,
      v1: 0.7,
      v2: -0.2,
      restitution: 0.9,
      externalForce: 0,
    });
    const forced = computeMetrics({
      mass1: 1.2,
      mass2: 2.1,
      v1: 0.7,
      v2: -0.2,
      restitution: 0.9,
      externalForce: 0.6,
    });
    expect(metricValue(forced, "drift")).toBeGreaterThan(metricValue(isolated, "drift"));
  });
});
