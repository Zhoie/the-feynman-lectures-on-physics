import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch01-s03-atomic-processes", () => {
  it("raises dissolution with higher temperature", () => {
    const cold = computeMetrics({
      temperature: 0.4,
      humidity: 0.3,
      saltConcentration: 0.2,
    });
    const hot = computeMetrics({
      temperature: 1.6,
      humidity: 0.3,
      saltConcentration: 0.2,
    });
    expect(metricValue(hot, "salt")).toBeGreaterThan(
      metricValue(cold, "salt")
    );
  });

  it("increases condensation with higher humidity", () => {
    const dry = computeMetrics({
      temperature: 0.8,
      humidity: 0.1,
      saltConcentration: 0.2,
    });
    const wet = computeMetrics({
      temperature: 0.8,
      humidity: 0.6,
      saltConcentration: 0.2,
    });
    expect(metricValue(wet, "cond")).toBeGreaterThan(
      metricValue(dry, "cond")
    );
  });
});
