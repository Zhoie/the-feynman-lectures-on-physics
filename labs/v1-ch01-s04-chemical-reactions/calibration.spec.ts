import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch01-s04 calibration", () => {
  it("increases rate with higher temperature", () => {
    const cold = computeMetrics({
      Ea: 1.6,
      deltaE: -0.2,
      temperature: 0.2,
      catalyst: 0,
    });
    const hot = computeMetrics({
      Ea: 1.6,
      deltaE: -0.2,
      temperature: 1.2,
      catalyst: 0,
    });
    expect(metricValue(hot, "rate")).toBeGreaterThan(metricValue(cold, "rate"));
  });

  it("increases rate with catalyst on", () => {
    const off = computeMetrics({
      Ea: 2.0,
      deltaE: -0.2,
      temperature: 0.6,
      catalyst: 0,
    });
    const on = computeMetrics({
      Ea: 2.0,
      deltaE: -0.2,
      temperature: 0.6,
      catalyst: 1,
    });
    expect(metricValue(on, "rate")).toBeGreaterThan(metricValue(off, "rate"));
  });
});
