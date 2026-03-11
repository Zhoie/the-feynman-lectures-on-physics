import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3-ch12-s03-the-energy-levels", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "nMax": 6,
  "scaleDrift": 0.01
});
    expect(metricValue(metrics, "energy_level_residual")).toBeLessThanOrEqual(0.02);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "nMax": 6,
  "scaleDrift": 0.01
});
    const stressed = computeMetrics({
  "nMax": 6,
  "scaleDrift": 0.08
});
    expect(metricValue(stressed, "energy_level_residual")).toBeGreaterThan(metricValue(baseline, "energy_level_residual"));
  });
});
