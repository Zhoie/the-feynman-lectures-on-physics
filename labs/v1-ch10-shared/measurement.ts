export type RandomFn = () => number;

export type SensorConfig = {
  sampleHz: number;
  smoothing: number;
  noiseStd: number;
  offset: number;
};

export type SensorState = {
  timer: number;
  held: number;
  output: number;
};

export function createMulberry32(seed: number): RandomFn {
  let localSeed = seed >>> 0;
  return function random() {
    let t = (localSeed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomNormal(random: RandomFn): number {
  const u1 = Math.max(1e-6, random());
  const u2 = random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function createSensorState(initial = 0): SensorState {
  return {
    timer: 0,
    held: initial,
    output: initial,
  };
}

export function updateSensor(
  state: SensorState,
  truth: number,
  dt: number,
  config: SensorConfig,
  random: RandomFn
): number {
  const sampleHz = Math.max(1, config.sampleHz);
  const samplePeriod = 1 / sampleHz;
  state.timer += dt;
  while (state.timer >= samplePeriod) {
    state.timer -= samplePeriod;
    state.held = truth;
  }

  const alpha = Math.max(0, Math.min(1, config.smoothing));
  state.output += alpha * (state.held - state.output);

  const noise = randomNormal(random) * Math.max(0, config.noiseStd);
  return state.output + config.offset + noise;
}

export function seriesRmsResidual(
  simulated: { x: number; y: number }[],
  reference: { x: number; y: number; uncertainty?: number }[]
) {
  if (!simulated.length || !reference.length) {
    return 0;
  }

  let sumSq = 0;
  let count = 0;
  for (const refPoint of reference) {
    let nearest = simulated[0];
    let best = Math.abs(simulated[0].x - refPoint.x);
    for (let i = 1; i < simulated.length; i += 1) {
      const candidate = simulated[i];
      const dist = Math.abs(candidate.x - refPoint.x);
      if (dist < best) {
        best = dist;
        nearest = candidate;
      }
    }
    const sigma = Math.max(1e-6, refPoint.uncertainty ?? 1);
    const residual = (nearest.y - refPoint.y) / sigma;
    sumSq += residual * residual;
    count += 1;
  }
  return Math.sqrt(sumSq / Math.max(1, count));
}
