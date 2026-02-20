import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing numeric metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s05 calibration", () => {
  it("keeps low-speed error percentage tiny", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.2, vProbe: 0.01 });
    expect(metricValue(metrics, "err")).toBeLessThan(0.1);
  });

  it("shows large high-speed error percentage", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.95, vProbe: 0.9 });
    expect(metricValue(metrics, "err")).toBeGreaterThan(10);
  });
});
