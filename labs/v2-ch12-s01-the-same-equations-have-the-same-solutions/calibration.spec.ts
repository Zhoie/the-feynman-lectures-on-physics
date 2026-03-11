import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metric(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const item = metrics.find((entry) => entry.id === id);
  if (!item) {
    throw new Error(`Missing metric ${id}`);
  }
  return item;
}

describe("v2-ch12-s01-the-same-equations-have-the-same-solutions calibration", () => {
  it("has no failed status on key gates", () => {
    const metrics = computeMetrics({
  "amplitude": 1,
  "decay": 0.8,
  "offset": 0
});
    const keyIds = ["shape_overlap"];
    const failed = metrics.filter(
      (item) => keyIds.includes(item.id) && item.status === "fail"
    );
    expect(failed).toEqual([]);
  });

  it("stays within benchmark residual envelope", () => {
    const metrics = computeMetrics({
  "amplitude": 1,
  "decay": 0.8,
  "offset": 0
});
    const residual = metric(metrics, "benchmark_residual_sigma");
    if (typeof residual.value !== "number") {
      throw new Error("benchmark_residual_sigma must be numeric");
    }
    expect(residual.value).toBeLessThanOrEqual(2);
  });
});
