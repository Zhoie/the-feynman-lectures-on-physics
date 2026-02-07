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
  it("keeps energy nearly constant for elastic collision", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 1,
    });
    expect(metricValue(metrics, "kRatio")).toBeGreaterThan(0.98);
  });

  it("reduces energy for inelastic collision", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 0.4,
    });
    expect(metricValue(metrics, "kRatio")).toBeLessThan(0.9);
  });
});
