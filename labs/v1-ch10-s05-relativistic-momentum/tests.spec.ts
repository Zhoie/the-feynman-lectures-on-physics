import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric || typeof metric.value !== "number") {
    throw new Error(`Missing metric ${id}`);
  }
  return metric.value;
}

describe("v1-ch10-s05-relativistic-momentum", () => {
  it("keeps error tiny at low speed", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.2, vProbe: 0.01 });
    expect(metricValue(metrics, "err")).toBeLessThan(1e-3);
  });

  it("shows large error at high speed", () => {
    const metrics = computeMetrics({ mass: 1, vMax: 0.95, vProbe: 0.9 });
    expect(metricValue(metrics, "err")).toBeGreaterThan(0.1);
  });
});
