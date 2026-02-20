import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s03 calibration", () => {
  it("keeps total momentum near zero", () => {
    const metrics = computeMetrics({ mass: 1.6, energy: 1.2 });
    expect(metricValue(metrics, "momentum")).toBeLessThan(1e-5);
  });

  it("keeps kinetic energy near release energy in early observation window", () => {
    const target = 1.0;
    const metrics = computeMetrics({ mass: 1.0, energy: target });
    expect(metricValue(metrics, "energy")).toBeCloseTo(target, 2);
  });
});
