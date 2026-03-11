import { describe, expect, it } from "vitest";
import { createV1Ch12Lab } from "./mechanics";

function metricValue(metrics: ReturnType<ReturnType<typeof createV1Ch12Lab>["computeMetrics"]>, id: string) {
  const metric = metrics.find((entry) => entry.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1 ch12 mechanics shared", () => {
  it("keeps friction transition error bounded near calibration baseline", () => {
    const { computeMetrics } = createV1Ch12Lab("v1-ch12-s02-friction");
    const metrics = computeMetrics({
      muStatic: 0.55,
      muKinetic: 0.42,
      normal: 18,
      switchBias: 0,
    });
    expect(metricValue(metrics, "friction_transition_error")).toBeLessThanOrEqual(0.05);
  });

  it("keeps pseudo-force balance residual under configured threshold", () => {
    const { computeMetrics } = createV1Ch12Lab("v1-ch12-s05-pseudo-forces");
    const metrics = computeMetrics({
      mass: 1.5,
      frameAccel: 3,
      springK: 12,
      displacement: 0.37,
    });
    expect(metricValue(metrics, "pseudo_equilibrium_residual")).toBeLessThanOrEqual(0.03);
  });

  it("keeps molecular equilibrium residual near calibration point", () => {
    const { computeMetrics } = createV1Ch12Lab("v1-ch12-s03-molecular-forces");
    const sigma = 0.8;
    const rEq = Math.pow(2, 1 / 6) * sigma;
    const metrics = computeMetrics({ epsilon: 1.2, sigma, distance: rEq });
    expect(metricValue(metrics, "molecular_equilibrium_residual")).toBeLessThanOrEqual(0.05);
  });
});
