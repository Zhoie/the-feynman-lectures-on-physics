import { describe, expect, it } from "vitest";
import {
  createRandomWalkState,
  stepRandomWalk,
  type RandomWalkParams,
} from "./random-walk";
import {
  createSimLoopState,
  stepFixedSimulation,
} from "@/core/simulation/fixed-step";

const params: RandomWalkParams = {
  count: 12,
  step: 0.08,
  drift: 0.01,
  spread: 0.7,
};

function run(frameTimes: number[]) {
  const state = createRandomWalkState(params.count, params.spread, 42);
  let loop = createSimLoopState();
  frameTimes.forEach((frameDt) => {
    const result = stepFixedSimulation(
      loop,
      frameDt,
      { fixedDt: 1 / 60, maxSubSteps: 120, maxFrameDt: 1 },
      (dt) => stepRandomWalk(state, params, dt)
    );
    loop = result.state;
  });
  return state.walkers;
}

describe("random walk model", () => {
  it("is reproducible for a fixed seed", () => {
    expect(run(new Array(60).fill(1 / 60))).toEqual(
      run(new Array(60).fill(1 / 60))
    );
  });

  it("matches across different rendered frame schedules", () => {
    const atSixty = run(new Array(60).fill(1 / 60));
    const atThirty = run(new Array(30).fill(1 / 30));
    expect(atThirty).toEqual(atSixty);
  });
});
