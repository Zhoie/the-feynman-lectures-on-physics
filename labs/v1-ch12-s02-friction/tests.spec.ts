import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch12-s02-friction", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "muStatic": 0.55,
  "muKinetic": 0.42,
  "normal": 18,
  "switchBias": 0
});
    expect(metricValue(metrics, "friction_transition_error")).toBeLessThanOrEqual(0.05);
    expect(metricValue(metrics, "friction_energy_spike")).toBeLessThanOrEqual(0.001);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "muStatic": 0.55,
  "muKinetic": 0.42,
  "normal": 18,
  "switchBias": 0
});
    const stressed = computeMetrics({
  "muStatic": 0.55,
  "muKinetic": 0.42,
  "normal": 18,
  "switchBias": 0.07
});
    expect(metricValue(stressed, "friction_transition_error")).toBeGreaterThan(metricValue(baseline, "friction_transition_error"));
  });
});
