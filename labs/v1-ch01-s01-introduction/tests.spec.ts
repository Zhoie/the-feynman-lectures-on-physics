import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch01-s01-introduction", () => {
  it("keeps constant-mass error tiny at low speed", () => {
    const metrics = computeMetrics({ vMax: 0.005, noise: 0, modelType: 0 });
    expect(metricValue(metrics, "rms")).toBeLessThan(1e-3);
  });

  it("shows constant-mass error growing at high speed", () => {
    const metrics = computeMetrics({ vMax: 0.9, noise: 0, modelType: 0 });
    expect(metricValue(metrics, "rms")).toBeGreaterThan(1e-2);
  });

  it("relativistic model reduces error at high speed", () => {
    const metrics = computeMetrics({ vMax: 0.9, noise: 0, modelType: 1 });
    expect(metricValue(metrics, "rms")).toBeLessThan(1e-3);
  });
});
