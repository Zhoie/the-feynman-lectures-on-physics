import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metric(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const item = metrics.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Missing metric ${id}`);
  }
  return item;
}

describe("v1-ch12-s02-friction calibration", () => {
  it("has no failed status on key gates", () => {
    const metrics = computeMetrics({
  "muStatic": 0.55,
  "muKinetic": 0.42,
  "normal": 18,
  "switchBias": 0
});
    const keyIds = ["friction_transition_error", "friction_energy_spike"];
    const failed = metrics.filter(
      (item) => keyIds.includes(item.id) && item.status === "fail"
    );
    expect(failed).toEqual([]);
  });

  it("stays within benchmark residual envelope", () => {
    const metrics = computeMetrics({
  "muStatic": 0.55,
  "muKinetic": 0.42,
  "normal": 18,
  "switchBias": 0
});
    const residual = metric(metrics, "benchmark_residual_sigma");
    if (typeof residual.value !== "number") {
      throw new Error("benchmark_residual_sigma must be numeric");
    }
    expect(residual.value).toBeLessThanOrEqual(2);
  });
});
