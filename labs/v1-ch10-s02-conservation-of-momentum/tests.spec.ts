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
  it("keeps momentum steady without external force", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 2,
      v1: 0.6,
      v2: -0.2,
      restitution: 0.9,
      externalForce: 0,
    });
    expect(metricValue(metrics, "drift")).toBeLessThan(1e-2);
  });

  it("changes momentum under external force", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 2,
      v1: 0.6,
      v2: -0.2,
      restitution: 0.9,
      externalForce: 0.6,
    });
    expect(metricValue(metrics, "drift")).toBeGreaterThan(1e-2);
  });
});
