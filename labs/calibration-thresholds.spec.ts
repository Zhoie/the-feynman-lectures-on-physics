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
import { computeMetrics as mV1Ch12s01 } from "@/labs/v1-ch12-s01-what-is-a-force/model";
import { computeMetrics as mV1Ch12s02 } from "@/labs/v1-ch12-s02-friction/model";
import { computeMetrics as mV1Ch12s03 } from "@/labs/v1-ch12-s03-molecular-forces/model";
import { computeMetrics as mV1Ch12s04 } from "@/labs/v1-ch12-s04-fundamental-forces-fields/model";
import { computeMetrics as mV1Ch12s05 } from "@/labs/v1-ch12-s05-pseudo-forces/model";
import { computeMetrics as mV1Ch12s06 } from "@/labs/v1-ch12-s06-nuclear-forces/model";
import { computeMetrics as mV2Ch12s01 } from "@/labs/v2-ch12-s01-the-same-equations-have-the-same-solutions/model";
import { computeMetrics as mV2Ch12s02 } from "@/labs/v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary/model";
import { computeMetrics as mV2Ch12s03 } from "@/labs/v2-ch12-s03-the-stretched-membrane/model";
import { computeMetrics as mV2Ch12s04 } from "@/labs/v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium/model";
import { computeMetrics as mV2Ch12s05 } from "@/labs/v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere/model";
import { computeMetrics as mV2Ch12s06 } from "@/labs/v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane/model";
import { computeMetrics as mV2Ch12s07 } from "@/labs/v2-ch12-s07-the-underlying-unity-of-nature/model";
import { computeMetrics as mV3Ch12s01 } from "@/labs/v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles/model";
import { computeMetrics as mV3Ch12s02 } from "@/labs/v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen/model";
import { computeMetrics as mV3Ch12s03 } from "@/labs/v3-ch12-s03-the-energy-levels/model";
import { computeMetrics as mV3Ch12s04 } from "@/labs/v3-ch12-s04-the-zeeman-splitting/model";
import { computeMetrics as mV3Ch12s05 } from "@/labs/v3-ch12-s05-the-states-in-a-magnetic-field/model";
import { computeMetrics as mV3Ch12s06 } from "@/labs/v3-ch12-s06-the-projection-matrix-for-spin-one6/model";

type Metric = {
  id: string;
  status?: "ok" | "warn" | "fail";
};

const C = 299_792_458;

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
        metrics: mCh10s01({ mass2: 1.5, stretch: 0.12, sensorNoise: 0.04, sensorSmoothing: 0.22 }) as Metric[],
        keyMetricIds: ["true_force_balance", "measured_force_balance_norm", "dataset_residual_sigma"],
      },
      {
        name: "v1-ch10-s02",
        metrics: mCh10s02({ mass1: 1, mass2: 2, v1: 0.6, v2: -0.2, restitution: 0.9, pulseForce: 0, pulseDuration: 0, rollingMu: 0, slopeDeg: 0, viscousCoeff: 0 }) as Metric[],
        keyMetricIds: ["momentum", "drift", "dataset_residual_sigma"],
      },
      {
        name: "v1-ch10-s03",
        metrics: mCh10s03({ mass: 1, releaseImpulse: 0.28, releaseDuration: 0.08, asymmetry: 0, fixtureFriction: 0 }) as Metric[],
        keyMetricIds: ["momentum_drift_norm", "com_drift_norm", "energy_window_ratio", "dataset_residual_sigma"],
      },
      {
        name: "v1-ch10-s04",
        metrics: mCh10s04({ mass1: 1, mass2: 1.5, v1: 0.8, v2: -0.4, restitution: 1, restitutionSlope: 0, lossCoeff: 0 }) as Metric[],
        keyMetricIds: ["momentum_drift_norm", "energy_window_ratio"],
      },
      {
        name: "v1-ch10-s05",
        metrics: mCh10s05({ mass: 1, vMax: 0.95 * C, vProbe: 0.75 * C }) as Metric[],
        keyMetricIds: ["formula_residual_pct", "dataset_residual_sigma"],
      },
      {
        name: "v1-ch12-s01",
        metrics: mV1Ch12s01({ mass: 1.5, force: 12, sensorBias: 0 }) as Metric[],
        keyMetricIds: ["force_law_error"],
      },
      {
        name: "v1-ch12-s02",
        metrics: mV1Ch12s02({ muStatic: 0.55, muKinetic: 0.42, normal: 18, switchBias: 0 }) as Metric[],
        keyMetricIds: ["friction_transition_error", "friction_energy_spike"],
      },
      {
        name: "v1-ch12-s03",
        metrics: mV1Ch12s03({ epsilon: 1.2, sigma: 0.8, distance: 0.89797 }) as Metric[],
        keyMetricIds: ["molecular_equilibrium_residual"],
      },
      {
        name: "v1-ch12-s04",
        metrics: mV1Ch12s04({ strength: 10, distanceScale: 1.2, slopeBias: 0 }) as Metric[],
        keyMetricIds: ["inverse_square_residual"],
      },
      {
        name: "v1-ch12-s05",
        metrics: mV1Ch12s05({ mass: 1.5, frameAccel: 3, springK: 12, displacement: 0.37 }) as Metric[],
        keyMetricIds: ["pseudo_equilibrium_residual"],
      },
      {
        name: "v1-ch12-s06",
        metrics: mV1Ch12s06({ coupling: 35, lambda: 0.8, rangeScale: 1 }) as Metric[],
        keyMetricIds: ["nuclear_short_range_mismatch"],
      },
      {
        name: "v2-ch12-s01",
        metrics: mV2Ch12s01({ amplitude: 1, decay: 0.8, offset: 0 }) as Metric[],
        keyMetricIds: ["shape_overlap"],
      },
      {
        name: "v2-ch12-s02",
        metrics: mV2Ch12s02({ diffusivity: 0.7, sourceDistance: 0.8, time: 0.8, boundaryBias: 0 }) as Metric[],
        keyMetricIds: ["boundary_error"],
      },
      {
        name: "v2-ch12-s03",
        metrics: mV2Ch12s03({ amplitude: 1, boundaryDrift: 0 }) as Metric[],
        keyMetricIds: ["boundary_residual"],
      },
      {
        name: "v2-ch12-s04",
        metrics: mV2Ch12s04({ diffusionLength: 1.2, sourceStrength: 1.5, modelDrift: 0.01 }) as Metric[],
        keyMetricIds: ["radial_residual"],
      },
      {
        name: "v2-ch12-s05",
        metrics: mV2Ch12s05({ radius: 1, freeSpeed: 1.3, surfaceBias: 0 }) as Metric[],
        keyMetricIds: ["normal_velocity_residual"],
      },
      {
        name: "v2-ch12-s06",
        metrics: mV2Ch12s06({ meanLux: 100, tilt: 0.01, ripple: 0.02 }) as Metric[],
        keyMetricIds: ["illumination_cv"],
      },
      {
        name: "v2-ch12-s07",
        metrics: mV2Ch12s07({ phaseMismatch: 0.03, amplitudeDrift: 0.02 }) as Metric[],
        keyMetricIds: ["unity_rms"],
      },
      {
        name: "v3-ch12-s01",
        metrics: mV3Ch12s01({ leakage: 0 }) as Metric[],
        keyMetricIds: ["orthonormal_error"],
      },
      {
        name: "v3-ch12-s02",
        metrics: mV3Ch12s02({ offdiag: 1.5, asymmetry: 0 }) as Metric[],
        keyMetricIds: ["hermitian_residual"],
      },
      {
        name: "v3-ch12-s03",
        metrics: mV3Ch12s03({ nMax: 6, scaleDrift: 0.01 }) as Metric[],
        keyMetricIds: ["energy_level_residual"],
      },
      {
        name: "v3-ch12-s04",
        metrics: mV3Ch12s04({ slopeScale: 1, noise: 0.01 }) as Metric[],
        keyMetricIds: ["zeeman_r2", "zeeman_slope_error"],
      },
      {
        name: "v3-ch12-s05",
        metrics: mV3Ch12s05({ field: 1.4, drift: 0.0002 }) as Metric[],
        keyMetricIds: ["norm_drift"],
      },
      {
        name: "v3-ch12-s06",
        metrics: mV3Ch12s06({ leakage: 0 }) as Metric[],
        keyMetricIds: ["projection_error"],
      },
    ];

    for (const scenario of scenarios) {
      const missing = scenario.keyMetricIds.filter(
        (metricId) => !scenario.metrics.some((metric) => metric.id === metricId)
      );
      expect(
        missing,
        `${scenario.name} is missing key metrics: ${missing.join(", ")}`
      ).toEqual([]);

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
