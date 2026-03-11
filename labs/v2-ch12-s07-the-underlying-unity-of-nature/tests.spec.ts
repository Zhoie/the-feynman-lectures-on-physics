import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s07-the-underlying-unity-of-nature", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "phaseMismatch": 0.03,
  "amplitudeDrift": 0.02
});
    expect(metricValue(metrics, "unity_rms")).toBeLessThanOrEqual(0.03);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "phaseMismatch": 0.03,
  "amplitudeDrift": 0.02
});
    const stressed = computeMetrics({
  "phaseMismatch": 0.35,
  "amplitudeDrift": 0.22
});
    expect(metricValue(stressed, "unity_rms")).toBeGreaterThan(metricValue(baseline, "unity_rms"));
  });
});
