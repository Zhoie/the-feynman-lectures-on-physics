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
  it("keeps action-reaction sum near zero", () => {
    const metrics = computeMetrics({
      mass2: 1.5,
      stretch: 0.25,
    });
    expect(Math.abs(metricValue(metrics, "forceSum"))).toBeLessThan(1e-3);
  });

  it("keeps force balance with unequal masses", () => {
    const metrics = computeMetrics({
      mass2: 3.2,
      stretch: 0.45,
    });
    expect(Math.abs(metricValue(metrics, "forceSum"))).toBeLessThan(1e-3);
  });
});
