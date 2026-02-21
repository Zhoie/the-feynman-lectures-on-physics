import { describe, expect, it } from "vitest";
import {
  getCh10BenchmarkProfile,
  validateBenchmarkProfile,
  type BenchmarkProfile,
} from "./index";

const IDS = [
  "ch10-s01-force-sensor",
  "ch10-s02-collision-track",
  "ch10-s03-recoil",
  "ch10-s04-energy-loss",
  "ch10-s05-relativistic-momentum",
] as const;

describe("ch10 benchmark profiles", () => {
  it("have valid schema and metadata fields", () => {
    for (const id of IDS) {
      const profile = getCh10BenchmarkProfile(id) as BenchmarkProfile | undefined;
      expect(profile, `${id} should exist`).toBeTruthy();
      const errors = validateBenchmarkProfile(profile as BenchmarkProfile);
      expect(errors, `${id} schema errors: ${errors.join("; ")}`).toEqual([]);
    }
  });

  it("declares monotonic x for all profiles", () => {
    for (const id of IDS) {
      const profile = getCh10BenchmarkProfile(id) as BenchmarkProfile;
      for (let i = 1; i < profile.x.length; i += 1) {
        expect(profile.x[i]).toBeGreaterThan(profile.x[i - 1]);
      }
    }
  });
});
