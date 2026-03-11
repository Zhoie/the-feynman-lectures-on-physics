import { describe, expect, it } from "vitest";
import { createV2Ch12Lab } from "./continuum";

function metricValue(metrics: ReturnType<ReturnType<typeof createV2Ch12Lab>["computeMetrics"]>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v2 ch12 continuum shared", () => {
  it("enforces heat boundary residual threshold", () => {
    const { computeMetrics } = createV2Ch12Lab(
      "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary"
    );
    const metrics = computeMetrics({
      diffusivity: 0.7,
      sourceDistance: 0.8,
      time: 0.8,
      boundaryBias: 0,
    });
    expect(metricValue(metrics, "boundary_error")).toBeLessThanOrEqual(0.02);
  });

  it("keeps membrane boundary residual under 1e-3", () => {
    const { computeMetrics } = createV2Ch12Lab("v2-ch12-s03-the-stretched-membrane");
    const metrics = computeMetrics({ amplitude: 1, boundaryDrift: 0 });
    expect(metricValue(metrics, "boundary_residual")).toBeLessThanOrEqual(1e-3);
  });

  it("keeps cross-domain unity RMS below 3%", () => {
    const { computeMetrics } = createV2Ch12Lab("v2-ch12-s07-the-underlying-unity-of-nature");
    const metrics = computeMetrics({ phaseMismatch: 0.03, amplitudeDrift: 0.02 });
    expect(metricValue(metrics, "unity_rms")).toBeLessThanOrEqual(0.03);
  });
});
