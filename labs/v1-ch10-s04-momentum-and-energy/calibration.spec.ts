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
  it("keeps K/K0 near 1 when restitution is 1", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 1,
    });
    expect(metricValue(metrics, "kRatio")).toBeGreaterThan(0.95);
  });

  it("reduces K/K0 when restitution is low", () => {
    const metrics = computeMetrics({
      mass1: 1,
      mass2: 1.5,
      v1: 0.8,
      v2: -0.4,
      restitution: 0.3,
    });
    expect(metricValue(metrics, "kRatio")).toBeLessThan(0.9);
  });
});
