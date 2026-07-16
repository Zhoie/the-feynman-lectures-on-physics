export type RandomWalkParams = {
  count: number;
  step: number;
  drift: number;
  spread: number;
};

type Walker = { x: number; y: number };

export type RandomWalkState = {
  walkers: Walker[];
  randomState: number;
};

const UINT32_SCALE = 4_294_967_296;
const DEFAULT_SEED = 0x6d2b79f5;

function nextRandom(state: RandomWalkState) {
  let value = (state.randomState + 0x6d2b79f5) | 0;
  state.randomState = value;
  value = Math.imul(value ^ (value >>> 15), value | 1);
  value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
  return ((value ^ (value >>> 14)) >>> 0) / UINT32_SCALE;
}

export function createRandomWalkState(
  count: number,
  spread: number,
  seed = DEFAULT_SEED
): RandomWalkState {
  const state: RandomWalkState = {
    walkers: [],
    randomState: seed | 0,
  };
  const safeCount = Math.max(1, Math.round(count));
  const safeSpread = Number.isFinite(spread) ? Math.max(0, spread) : 0;
  state.walkers = Array.from({ length: safeCount }, () => ({
    x: (nextRandom(state) - 0.5) * safeSpread,
    y: (nextRandom(state) - 0.5) * safeSpread,
  }));
  return state;
}

export function stepRandomWalk(
  state: RandomWalkState,
  params: RandomWalkParams,
  dt: number
) {
  const safeDt = Number.isFinite(dt) ? Math.max(0, dt) : 0;
  const step = Number.isFinite(params.step) ? Math.max(0, params.step) : 0;
  const drift = Number.isFinite(params.drift) ? params.drift : 0;
  const diffusionScale = step * Math.sqrt(safeDt * 60);
  const driftStep = drift * safeDt * 60;

  state.walkers.forEach((walker) => {
    walker.x += (nextRandom(state) - 0.5) * diffusionScale + driftStep;
    walker.y += (nextRandom(state) - 0.5) * diffusionScale;
  });
}
