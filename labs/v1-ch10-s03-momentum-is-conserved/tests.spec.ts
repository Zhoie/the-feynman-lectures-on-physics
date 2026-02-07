import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s03-momentum-is-conserved", () => {
  it("keeps total momentum near zero for any energy release", () => {
    const metrics = computeMetrics({
      mass: 1.5,
      energy: 1.2,
    });
    expect(metricValue(metrics, "momentum")).toBeLessThan(1e-6);
  });

  it("keeps p1 and p2 equal and opposite", () => {
    const metrics = computeMetrics({
      mass: 2.0,
      energy: 1.0,
    });
    const p1 = metricValue(metrics, "p1");
    const p2 = metricValue(metrics, "p2");
    expect(p1 + p2).toBeCloseTo(0, 6);
  });

  it("matches kinetic energy to the release energy", () => {
    const releaseEnergy = 1.2;
    const metrics = computeMetrics({
      mass: 1.0,
      energy: releaseEnergy,
    });
    expect(metricValue(metrics, "energy")).toBeCloseTo(releaseEnergy, 3);
  });
});
