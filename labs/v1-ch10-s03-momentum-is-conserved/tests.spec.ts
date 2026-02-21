import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s03-momentum-is-conserved", () => {
  it("keeps total momentum drift inside the pre-wall 1% gate", () => {
    const metrics = computeMetrics({
      mass: 1.5,
      releaseImpulse: 0.32,
      releaseDuration: 0.09,
      asymmetry: 0,
      fixtureFriction: 0,
    });
    expect(metricValue(metrics, "momentum_drift_norm")).toBeLessThanOrEqual(0.01);
  });

  it("keeps left/right momentum pair consistent with near-zero total", () => {
    const metrics = computeMetrics({
      mass: 1.8,
      releaseImpulse: 0.3,
      releaseDuration: 0.08,
    });
    const pLeft = metricValue(metrics, "p_left");
    const pRight = metricValue(metrics, "p_right");
    const pTotal = metricValue(metrics, "p_total");
    expect(pLeft + pRight).toBeCloseTo(pTotal, 5);
  });

  it("keeps kinetic energy stable within the pre-wall observation window", () => {
    const metrics = computeMetrics({
      mass: 1,
      releaseImpulse: 0.26,
      releaseDuration: 0.08,
      fixtureFriction: 0,
    });
    expect(metricValue(metrics, "energy_window_ratio")).toBeGreaterThanOrEqual(0.95);
    expect(metricValue(metrics, "energy_window_ratio")).toBeLessThanOrEqual(1.05);
  });
});
