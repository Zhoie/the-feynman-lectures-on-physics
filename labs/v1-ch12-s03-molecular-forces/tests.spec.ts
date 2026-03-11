import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch12-s03-molecular-forces", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "epsilon": 1.2,
  "sigma": 0.8,
  "distance": 0.89797
});
    expect(metricValue(metrics, "molecular_equilibrium_residual")).toBeLessThanOrEqual(0.05);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "epsilon": 1.2,
  "sigma": 0.8,
  "distance": 0.89797
});
    const stressed = computeMetrics({
  "epsilon": 1.2,
  "sigma": 0.8,
  "distance": 1.2
});
    expect(metricValue(stressed, "molecular_equilibrium_residual")).toBeGreaterThan(metricValue(baseline, "molecular_equilibrium_residual"));
  });
});
