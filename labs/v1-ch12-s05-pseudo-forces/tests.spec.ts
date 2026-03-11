import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch12-s05-pseudo-forces", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "mass": 1.5,
  "frameAccel": 3,
  "springK": 12,
  "displacement": 0.37
});
    expect(metricValue(metrics, "pseudo_equilibrium_residual")).toBeLessThanOrEqual(0.03);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "mass": 1.5,
  "frameAccel": 3,
  "springK": 12,
  "displacement": 0.37
});
    const stressed = computeMetrics({
  "mass": 1.5,
  "frameAccel": 3,
  "springK": 8,
  "displacement": 0.6
});
    expect(metricValue(stressed, "pseudo_equilibrium_residual")).toBeGreaterThan(metricValue(baseline, "pseudo_equilibrium_residual"));
  });
});
