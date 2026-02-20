import type { SimulationConfig } from "../types";

export type SimLoopState = {
  accumulator: number;
};

export type SimLoopStepResult = {
  state: SimLoopState;
  steps: number;
  droppedTime: number;
};

const MIN_FIXED_DT = 1e-6;

export function defaultSimulationConfig(): SimulationConfig {
  return {
    fixedDt: 1 / 120,
    maxSubSteps: 8,
    maxFrameDt: 1 / 12,
  };
}

export function normalizeSimulationConfig(
  config?: Partial<SimulationConfig> | null
): SimulationConfig {
  const defaults = defaultSimulationConfig();
  const fixedDt = Math.max(MIN_FIXED_DT, config?.fixedDt ?? defaults.fixedDt);
  const maxSubSteps = Math.max(1, Math.floor(config?.maxSubSteps ?? defaults.maxSubSteps));
  const maxFrameDt = Math.max(
    fixedDt,
    config?.maxFrameDt ?? fixedDt * maxSubSteps
  );
  return { fixedDt, maxSubSteps, maxFrameDt };
}

export function createSimLoopState(): SimLoopState {
  return { accumulator: 0 };
}

export function stepFixedSimulation(
  loopState: SimLoopState,
  frameDt: number,
  configInput: Partial<SimulationConfig> | undefined,
  onStep: (dt: number) => void
): SimLoopStepResult {
  const config = normalizeSimulationConfig(configInput);
  const clampedFrame = Math.max(0, Math.min(frameDt, config.maxFrameDt ?? frameDt));
  let accumulator = loopState.accumulator + clampedFrame;
  let steps = 0;
  let droppedTime = 0;

  while (accumulator >= config.fixedDt && steps < config.maxSubSteps) {
    onStep(config.fixedDt);
    accumulator -= config.fixedDt;
    steps += 1;
  }

  if (accumulator >= config.fixedDt) {
    droppedTime = accumulator - (accumulator % config.fixedDt);
    accumulator %= config.fixedDt;
  }

  return {
    state: { accumulator },
    steps,
    droppedTime,
  };
}
