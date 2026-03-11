import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium", () => {
  it("passes baseline quantitative thresholds", () => {
    const metrics = computeMetrics({
  "diffusionLength": 1.2,
  "sourceStrength": 1.5,
  "modelDrift": 0.01
});
    expect(metricValue(metrics, "radial_residual")).toBeLessThanOrEqual(0.05);
  });

  it("shows expected directional response under stressed parameters", () => {
    const baseline = computeMetrics({
  "diffusionLength": 1.2,
  "sourceStrength": 1.5,
  "modelDrift": 0.01
});
    const stressed = computeMetrics({
  "diffusionLength": 1.2,
  "sourceStrength": 1.5,
  "modelDrift": 0.12
});
    expect(metricValue(stressed, "radial_residual")).toBeGreaterThan(metricValue(baseline, "radial_residual"));
  });
});
