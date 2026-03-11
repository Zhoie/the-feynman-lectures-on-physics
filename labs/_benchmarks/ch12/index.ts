import p01 from "./v1-ch12-s01-what-is-a-force.json";
import p02 from "./v1-ch12-s02-friction.json";
import p03 from "./v1-ch12-s03-molecular-forces.json";
import p04 from "./v1-ch12-s04-fundamental-forces-fields.json";
import p05 from "./v1-ch12-s05-pseudo-forces.json";
import p06 from "./v1-ch12-s06-nuclear-forces.json";
import p07 from "./v2-ch12-s01-the-same-equations-have-the-same-solutions.json";
import p08 from "./v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary.json";
import p09 from "./v2-ch12-s03-the-stretched-membrane.json";
import p10 from "./v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium.json";
import p11 from "./v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere.json";
import p12 from "./v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane.json";
import p13 from "./v2-ch12-s07-the-underlying-unity-of-nature.json";
import p14 from "./v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles.json";
import p15 from "./v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen.json";
import p16 from "./v3-ch12-s03-the-energy-levels.json";
import p17 from "./v3-ch12-s04-the-zeeman-splitting.json";
import p18 from "./v3-ch12-s05-the-states-in-a-magnetic-field.json";
import p19 from "./v3-ch12-s06-the-projection-matrix-for-spin-one6.json";

export type BenchmarkSamplingMeta = {
  xStart: number;
  xEnd: number;
  nominalStep?: number;
  window?: string;
};

export type BenchmarkProfile = {
  id: string;
  source: string;
  sourceUrl: string;
  quantity: string;
  unit: string;
  conversion: string;
  sampling: BenchmarkSamplingMeta;
  x: number[];
  y: number[];
  uncertainty: number[];
};

const profiles: Record<string, BenchmarkProfile> = {
  [p01.id]: p01,
  [p02.id]: p02,
  [p03.id]: p03,
  [p04.id]: p04,
  [p05.id]: p05,
  [p06.id]: p06,
  [p07.id]: p07,
  [p08.id]: p08,
  [p09.id]: p09,
  [p10.id]: p10,
  [p11.id]: p11,
  [p12.id]: p12,
  [p13.id]: p13,
  [p14.id]: p14,
  [p15.id]: p15,
  [p16.id]: p16,
  [p17.id]: p17,
  [p18.id]: p18,
  [p19.id]: p19,
};

export function getCh12BenchmarkProfile(id: keyof typeof profiles | string) {
  return profiles[id];
}

export function allCh12BenchmarkProfiles() {
  return Object.values(profiles);
}

export function validateBenchmarkProfile(profile: BenchmarkProfile) {
  const errors: string[] = [];
  if (!profile.id.trim()) {
    errors.push("id is required");
  }
  if (!profile.source.trim()) {
    errors.push("source is required");
  }
  if (!profile.sourceUrl.trim()) {
    errors.push("sourceUrl is required");
  }
  if (!profile.quantity.trim()) {
    errors.push("quantity is required");
  }
  if (!profile.unit.trim()) {
    errors.push("unit is required");
  }
  if (!profile.conversion.trim()) {
    errors.push("conversion is required");
  }
  if (!Number.isFinite(profile.sampling.xStart) || !Number.isFinite(profile.sampling.xEnd)) {
    errors.push("sampling range must be finite");
  }
  if (profile.x.length !== profile.y.length || profile.x.length !== profile.uncertainty.length) {
    errors.push("x/y/uncertainty lengths must match");
  }
  if (profile.x.length < 2) {
    errors.push("profile must contain at least two points");
  }
  for (let i = 0; i < profile.x.length; i += 1) {
    if (!Number.isFinite(profile.x[i]) || !Number.isFinite(profile.y[i])) {
      errors.push("point " + i + " has non-finite value");
      break;
    }
    if (!Number.isFinite(profile.uncertainty[i]) || profile.uncertainty[i] < 0) {
      errors.push("point " + i + " has invalid uncertainty");
      break;
    }
    if (i > 0 && profile.x[i] <= profile.x[i - 1]) {
      errors.push("x must be strictly increasing (index " + i + ")");
      break;
    }
  }
  if (profile.x[0] < profile.sampling.xStart || profile.x[profile.x.length - 1] > profile.sampling.xEnd) {
    errors.push("x points exceed declared sampling range");
  }
  return errors;
}

export function benchmarkSeries(profile: BenchmarkProfile) {
  return profile.x.map((x, i) => ({
    x,
    y: profile.y[i] ?? 0,
    uncertainty: profile.uncertainty[i] ?? 0,
  }));
}
