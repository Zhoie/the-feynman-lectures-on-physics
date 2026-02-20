import { describe, expect, it } from "vitest";
import { computeMetrics as mCh01s01 } from "@/labs/v1-ch01-s01-introduction/model";
import { computeMetrics as mCh01s02 } from "@/labs/v1-ch01-s02-matter-is-made-of-atoms/model";
import { computeMetrics as mCh01s03 } from "@/labs/v1-ch01-s03-atomic-processes/model";
import { computeMetrics as mCh01s04 } from "@/labs/v1-ch01-s04-chemical-reactions/model";
import { computeMetrics as mCh10s01 } from "@/labs/v1-ch10-s01-newton-s-third-law/model";
import { computeMetrics as mCh10s02 } from "@/labs/v1-ch10-s02-conservation-of-momentum/model";
import { computeMetrics as mCh10s03 } from "@/labs/v1-ch10-s03-momentum-is-conserved/model";
import { computeMetrics as mCh10s04 } from "@/labs/v1-ch10-s04-momentum-and-energy/model";
import { computeMetrics as mCh10s05 } from "@/labs/v1-ch10-s05-relativistic-momentum/model";

type Metric = {
  id: string;
  status?: "ok" | "warn" | "fail";
};

describe("calibration thresholds", () => {
  it("has no failed status for baseline scenarios", () => {
    const scenarios: Array<{
      name: string;
      metrics: Metric[];
      keyMetricIds: string[];
    }> = [
      {
        name: "v1-ch01-s01",
        metrics: mCh01s01({ vMax: 0.6, noise: 0.01, modelType: 1, benchmarkMode: 0 }) as Metric[],
        keyMetricIds: ["rms", "max"],
      },
      {
        name: "v1-ch01-s02",
        metrics: mCh01s02({ temperature: 0.8, density: 0.8, drag: 0.1 }) as Metric[],
        keyMetricIds: ["temp", "msd"],
      },
      {
        name: "v1-ch01-s03",
        metrics: mCh01s03({ temperature: 0.8, humidity: 0.3, saltConcentration: 0.2 }) as Metric[],
        keyMetricIds: ["evap", "cons"],
      },
      {
        name: "v1-ch01-s04",
        metrics: mCh01s04({ Ea: 1.6, deltaE: -0.2, temperature: 0.8, catalyst: 0 }) as Metric[],
        keyMetricIds: ["rate"],
      },
      {
        name: "v1-ch10-s01",
        metrics: mCh10s01({ mass2: 1.5, stretch: 0.25 }) as Metric[],
        keyMetricIds: ["forceSum", "forceDriftNorm"],
      },
      {
        name: "v1-ch10-s02",
        metrics: mCh10s02({
          mass1: 1,
          mass2: 2,
          v1: 0.6,
          v2: -0.2,
          restitution: 0.9,
          externalForce: 0,
        }) as Metric[],
        keyMetricIds: ["momentum", "drift"],
      },
      {
        name: "v1-ch10-s03",
        metrics: mCh10s03({ mass: 1, energy: 1 }) as Metric[],
        keyMetricIds: ["momentum", "energy"],
      },
      {
        name: "v1-ch10-s04",
        metrics: mCh10s04({ mass1: 1, mass2: 1, v1: 0.6, v2: -0.6, restitution: 1 }) as Metric[],
        keyMetricIds: ["momentum", "kRatio"],
      },
      {
        name: "v1-ch10-s05",
        metrics: mCh10s05({ mass: 1, vMax: 0.9, vProbe: 0.6 }) as Metric[],
        keyMetricIds: ["err"],
      },
    ];

    for (const scenario of scenarios) {
      const failed = scenario.metrics.filter(
        (metric) =>
          scenario.keyMetricIds.includes(metric.id) && metric.status === "fail"
      );
      expect(
        failed,
        `${scenario.name} has failed metrics: ${failed.map((metric) => metric.id).join(", ")}`
      ).toEqual([]);
    }
  });
});
