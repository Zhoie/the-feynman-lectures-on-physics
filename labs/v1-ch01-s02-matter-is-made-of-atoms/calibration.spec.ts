import { describe, expect, it } from "vitest";
import { computeMetrics } from "./model";

function metricValue(metrics: ReturnType<typeof computeMetrics>, id: string) {
  const metric = metrics.find((item) => item.id === id);
  if (!metric) throw new Error(`Missing metric ${id}`);
  return metric.value;
}

describe("v1-ch01-s02 calibration", () => {
  it("reports solid-like phase at low temperature and high density", () => {
    const metrics = computeMetrics({
      temperature: 0.15,
      density: 1.0,
      drag: 0.1,
    });
    expect(metricValue(metrics, "phase")).toBe("solid-like");
  });

  it("increases tracer MSD at higher temperature", () => {
    const cold = computeMetrics({
      temperature: 0.2,
      density: 0.8,
      drag: 0.1,
    });
    const hot = computeMetrics({
      temperature: 1.4,
      density: 0.8,
      drag: 0.1,
    });
    expect(Number(metricValue(hot, "msd"))).toBeGreaterThan(Number(metricValue(cold, "msd")));
  });
});
