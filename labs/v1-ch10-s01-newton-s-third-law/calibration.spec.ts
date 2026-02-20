import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s01 calibration", () => {
  it("keeps normalized force drift tiny", () => {
    const metrics = computeMetrics({ mass2: 2.3, stretch: 0.4 });
    expect(metricValue(metrics, "forceDriftNorm")).toBeLessThan(5e-4);
  });

  it("flags no failed metric status for force checks", () => {
    const metrics = computeMetrics({ mass2: 1.8, stretch: 0.3 });
    const failed = metrics.filter((metric) => metric.status === "fail");
    expect(failed.length).toBe(0);
  });
});
