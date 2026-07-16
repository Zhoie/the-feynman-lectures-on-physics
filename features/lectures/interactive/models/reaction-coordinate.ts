export type ReactionCoordinateParams = {
  barrier: number;
  reactionEnergy: number;
  temperature: number;
  catalyst: number;
};

const MIN_TEMPERATURE = 0.05;

function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

function catalystStrength(value: number) {
  return clamp01(Number.isFinite(value) ? value : 0);
}

export function reactionPotential(
  x: number,
  params: ReactionCoordinateParams
) {
  const catalyst = catalystStrength(params.catalyst);
  const barrier = Number.isFinite(params.barrier) ? params.barrier : 0;
  const reactionEnergy = Number.isFinite(params.reactionEnergy)
    ? params.reactionEnergy
    : 0;
  const baseBarrier = Math.max(0, barrier) * (1 - catalyst * 0.45);
  const well = baseBarrier * (x * x - 1) ** 2;
  const endpointProgress = clamp01((x + 1) / 2);
  const smoothProgress = endpointProgress ** 2 * (3 - 2 * endpointProgress);
  return well + reactionEnergy * smoothProgress;
}

export function reactionCoordinateSummary(params: ReactionCoordinateParams) {
  const reactantEnergy = reactionPotential(-1, params);
  const transitionEnergy = reactionPotential(0, params);
  const productEnergy = reactionPotential(1, params);
  const forwardBarrier = Math.max(0, transitionEnergy - reactantEnergy);
  const reverseBarrier = Math.max(0, transitionEnergy - productEnergy);
  const temperature = Math.max(
    MIN_TEMPERATURE,
    Number.isFinite(params.temperature) ? params.temperature : MIN_TEMPERATURE
  );
  return {
    reactantEnergy,
    transitionEnergy,
    productEnergy,
    forwardBarrier,
    reverseBarrier,
    crossingLikelihood: clamp01(Math.exp(-forwardBarrier / temperature)),
  };
}
