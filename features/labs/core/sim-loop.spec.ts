import { describe, expect, it } from "vitest";
import { createSimLoopState, stepFixedSimulation } from "./sim-loop";

type OscState = { x: number; v: number };

function runSequence(frameDts: number[]) {
  const sim = { x: 1, v: 0 } satisfies OscState;
  let loop = createSimLoopState();

  for (const frameDt of frameDts) {
    const result = stepFixedSimulation(
      loop,
      frameDt,
      {
        fixedDt: 0.005,
        maxSubSteps: 256,
      },
      (dt) => {
        const k = 4;
        const a = -k * sim.x;
        sim.v += a * dt;
        sim.x += sim.v * dt;
      }
    );
    loop = result.state;
  }

  return sim;
}

describe("stepFixedSimulation", () => {
  it("produces deterministic state across different frame dt partitions", () => {
    const total = 2.4; // 480 fixed steps of 0.005
    const seqA = new Array(480).fill(0.005);
    const seqB = [0.02, 0.015, 0.035, 0.01, 0.025, 0.04];
    const seqC: number[] = [];
    let t = 0;
    let i = 0;
    while (t < total) {
      const dt = seqB[i % seqB.length];
      const remain = total - t;
      seqC.push(Math.min(remain, dt));
      t += Math.min(remain, dt);
      i += 1;
    }

    const a = runSequence(seqA);
    const c = runSequence(seqC);
    expect(a.x).toBeCloseTo(c.x, 10);
    expect(a.v).toBeCloseTo(c.v, 10);
  });

  it("drops excess accumulated time when max substeps are exceeded", () => {
    let loop = createSimLoopState();
    let integrated = 0;

    const result = stepFixedSimulation(
      loop,
      1,
      {
        fixedDt: 0.01,
        maxSubSteps: 10,
        maxFrameDt: 1,
      },
      (dt) => {
        integrated += dt;
      }
    );
    loop = result.state;

    expect(integrated).toBeCloseTo(0.1, 10);
    expect(result.steps).toBe(10);
    expect(result.droppedTime).toBeGreaterThan(0);
    expect(loop.accumulator).toBeLessThan(0.01);
  });
});
