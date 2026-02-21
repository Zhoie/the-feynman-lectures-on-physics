import s01 from "./s01-force-sensor.json";
import s02 from "./s02-collision-track.json";
import s03 from "./s03-recoil.json";
import s04 from "./s04-energy-loss.json";
import s05 from "./s05-relativistic-momentum.json";

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
  [s01.id]: s01,
  [s02.id]: s02,
  [s03.id]: s03,
  [s04.id]: s04,
  [s05.id]: s05,
};

export function getCh10BenchmarkProfile(id: keyof typeof profiles | string) {
  return profiles[id];
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
      errors.push(`point ${i} has non-finite value`);
      break;
    }
    if (!Number.isFinite(profile.uncertainty[i]) || profile.uncertainty[i] < 0) {
      errors.push(`point ${i} has invalid uncertainty`);
      break;
    }
    if (i > 0 && profile.x[i] <= profile.x[i - 1]) {
      errors.push(`x must be strictly increasing (index ${i})`);
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
