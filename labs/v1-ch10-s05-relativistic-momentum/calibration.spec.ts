import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

const C = 299_792_458;

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s05 calibration", () => {
  it("keeps SI formula residual within 2%", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.95 * C, vProbe: 0.75 * C });
    expect(metricValue(metrics, "formula_residual_pct")).toBeLessThanOrEqual(2);
  });

  it("stays within dataset residual envelope", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.95 * C, vProbe: 0.85 * C });
    expect(metricValue(metrics, "dataset_residual_sigma")).toBeLessThanOrEqual(2);
  });

  it("shows monotonic growth of classical error with beta", () => {
    const low = computeMetrics({ mass: 1, vMax: 0.4 * C, vProbe: 0.2 * C });
    const high = computeMetrics({ mass: 1, vMax: 0.95 * C, vProbe: 0.85 * C });
    expect(metricValue(high, "relative_error_pct")).toBeGreaterThan(metricValue(low, "relative_error_pct"));
  });
});
