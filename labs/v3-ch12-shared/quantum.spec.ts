import { describe, expect, it } from "vitest";
import { createV3Ch12Lab } from "./quantum";

function metricValue(metrics: ReturnType<ReturnType<typeof createV3Ch12Lab>["computeMetrics"]>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v3 ch12 quantum shared", () => {
  it("keeps Hermitian residual near machine threshold", () => {
    const { computeMetrics } = createV3Ch12Lab(
      "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen"
    );
    const metrics = computeMetrics({ offdiag: 1.5, asymmetry: 0 });
    expect(metricValue(metrics, "hermitian_residual")).toBeLessThanOrEqual(1e-10);
  });

  it("keeps projection operator error under strict tolerance", () => {
    const { computeMetrics } = createV3Ch12Lab(
      "v3-ch12-s06-the-projection-matrix-for-spin-one6"
    );
    const metrics = computeMetrics({ leakage: 0 });
    expect(metricValue(metrics, "projection_error")).toBeLessThanOrEqual(1e-8);
  });

  it("maintains state norm drift under 0.1%", () => {
    const { computeMetrics } = createV3Ch12Lab("v3-ch12-s05-the-states-in-a-magnetic-field");
    const metrics = computeMetrics({ field: 1.4, drift: 0.0002 });
    expect(metricValue(metrics, "norm_drift")).toBeLessThanOrEqual(0.001);
  });
});
