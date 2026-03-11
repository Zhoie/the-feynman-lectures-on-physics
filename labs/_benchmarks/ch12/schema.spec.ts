import { describe, expect, it } from "vitest";
import {
  getCh12BenchmarkProfile,
  validateBenchmarkProfile,
  type BenchmarkProfile,
} from "./index";

const IDS = [
  "v1-ch12-s01-what-is-a-force",
  "v1-ch12-s02-friction",
  "v1-ch12-s03-molecular-forces",
  "v1-ch12-s04-fundamental-forces-fields",
  "v1-ch12-s05-pseudo-forces",
  "v1-ch12-s06-nuclear-forces",
  "v2-ch12-s01-the-same-equations-have-the-same-solutions",
  "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary",
  "v2-ch12-s03-the-stretched-membrane",
  "v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium",
  "v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere",
  "v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane",
  "v2-ch12-s07-the-underlying-unity-of-nature",
  "v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles",
  "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen",
  "v3-ch12-s03-the-energy-levels",
  "v3-ch12-s04-the-zeeman-splitting",
  "v3-ch12-s05-the-states-in-a-magnetic-field",
  "v3-ch12-s06-the-projection-matrix-for-spin-one6",
] as const;

describe("ch12 benchmark profiles", () => {
  it("have valid schema and metadata fields", () => {
    for (const id of IDS) {
      const profile = getCh12BenchmarkProfile(id) as BenchmarkProfile | undefined;
      expect(profile, `${id} should exist`).toBeTruthy();
      const errors = validateBenchmarkProfile(profile as BenchmarkProfile);
      expect(errors, `${id} schema errors: ${errors.join("; ")}`).toEqual([]);
    }
  });

  it("declares monotonic x for all profiles", () => {
    for (const id of IDS) {
      const profile = getCh12BenchmarkProfile(id) as BenchmarkProfile;
      for (let i = 1; i < profile.x.length; i += 1) {
        expect(profile.x[i]).toBeGreaterThan(profile.x[i - 1]);
      }
    }
  });
});
