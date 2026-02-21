import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metric(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const item = metrics.find((entry) => entry.id === id);
  if (!item || typeof item.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return item;
}

describe("v1-ch10-s01 calibration", () => {
  it("keeps measured force-pair normalized residual under 2%", () => {
    const metrics = computeMetrics({
      mass2: 1.8,
      stretch: 0.1,
      sensorHz: 180,
      sensorSmoothing: 0.3,
      sensorNoise: 0.005,
      sensorOffset: 0,
    });
    const value = metric(metrics, "measured_force_balance_norm").value as number;
    expect(value).toBeLessThanOrEqual(0.02);
  });

  it("matches benchmark envelope within 2 sigma RMS", () => {
    const metrics = computeMetrics({
      mass2: 1.2,
      stretch: 0.1,
      sensorNoise: 0.05,
      sensorSmoothing: 0.22,
    });
    const value = metric(metrics, "dataset_residual_sigma").value as number;
    expect(value).toBeLessThanOrEqual(2);
  });

  it("exposes no failed status for key force metrics", () => {
    const metrics = computeMetrics({ mass2: 1.6, stretch: 0.12 });
    const keys = [
      "true_force_balance",
      "measured_force_balance_norm",
      "dataset_residual_sigma",
    ];
    const failed = metrics.filter(
      (item) => keys.includes(item.id) && item.status === "fail"
    );
    expect(failed).toEqual([]);
  });
});
