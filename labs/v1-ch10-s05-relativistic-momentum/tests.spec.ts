import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

const C = 299_792_458;

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s05-relativistic-momentum", () => {
  it("keeps classical error tiny at low beta", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 5_000_000, vProbe: 1_000_000 });
    expect(metricValue(metrics, "relative_error_pct")).toBeLessThan(0.01);
  });

  it("shows large classical underestimation near light speed", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.95 * C, vProbe: 0.9 * C });
    expect(metricValue(metrics, "relative_error_pct")).toBeGreaterThan(10);
  });
});
