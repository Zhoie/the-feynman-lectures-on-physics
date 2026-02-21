import { describe, expect, it } from "vitest";
import { createSimLoopState, stepFixedSimulation } from "@/features/labs/core/sim-loop";
import {
  externalPulseForce,
  integrateBody,
  kineticEnergy,
  momentum,
  pulseFromImpulse,
  resolveBodyCollision,
  resolveWallContact,
  type Body1D,
} from "./physics";

function clone(body: Body1D): Body1D {
  return { ...body };
}

describe("v1-ch10-shared physics", () => {
  it("preserves momentum and energy for elastic two-body collision", () => {
    const a = { x: -0.04, v: 1.2, m: 1, halfSize: 0.05 };
    const b = { x: 0.04, v: -0.6, m: 1.5, halfSize: 0.05 };
    const p0 = momentum(a, b);
    const k0 = kineticEnergy(a, b);

    const collided = resolveBodyCollision(a, b, 1);
    expect(collided).toBe(true);
    expect(momentum(a, b)).toBeCloseTo(p0, 10);
    expect(kineticEnergy(a, b)).toBeCloseTo(k0, 8);
  });

  it("keeps event ordering stable under different dt partitions", () => {
    const run = (frameDts: number[]) => {
      const body = { x: -0.7, v: 1.2, m: 1, halfSize: 0.06 };
      let loop = createSimLoopState();
      for (const frameDt of frameDts) {
        const stepped = stepFixedSimulation(
          loop,
          frameDt,
          {
            fixedDt: 1 / 360,
            maxSubSteps: 80,
            maxFrameDt: 0.08,
          },
          (dt) => {
            integrateBody(body, -0.8 * body.v, dt);
            resolveWallContact(body, {
              left: -1,
              right: 1,
              wallRestitution: 0.92,
              bufferDamping: 0.1,
            });
          }
        );
        loop = stepped.state;
      }
      return { body, loop };
    };

    const total = 1.8;
    const framesA = new Array(216).fill(total / 216);
    const template = [0.06, 0.01, 0.03, 0.04, 0.08, 0.02];
    const framesB: number[] = [];
    let elapsed = 0;
    let i = 0;
    while (elapsed < total) {
      const dt = Math.min(template[i % template.length], total - elapsed);
      framesB.push(dt);
      elapsed += dt;
      i += 1;
    }

    const a = run(framesA);
    const b = run(framesB);
    expect(a.body.v).toBeCloseTo(b.body.v, 10);
    expect(a.body.x).toBeCloseTo(b.body.x, 10);
    expect(a.loop.accumulator).toBeCloseTo(b.loop.accumulator, 10);
  });

  it("integrates finite pulse force to the configured impulse", () => {
    const pulse = pulseFromImpulse(0.2, 0.15, 0.45);
    const dt = 1 / 5000;
    let impulse = 0;
    for (let t = pulse.start; t < pulse.start + pulse.duration; t += dt) {
      impulse += externalPulseForce(t, pulse) * dt;
    }
    expect(impulse).toBeCloseTo(0.45, 2);
  });

  it("resolves wall contact with bounded rebound", () => {
    const cart = { x: 0.98, v: 2, m: 1, halfSize: 0.05 };
    const hit = resolveWallContact(cart, {
      left: -1,
      right: 1,
      wallRestitution: 0.8,
      bufferDamping: 0.1,
    });
    expect(hit).toBe(true);
    expect(cart.x + cart.halfSize).toBeLessThanOrEqual(1);
    expect(cart.v).toBeLessThan(0);

    const untouched = clone(cart);
    untouched.x = 0;
    untouched.v = 0.1;
    const noHit = resolveWallContact(untouched, {
      left: -1,
      right: 1,
      wallRestitution: 0.8,
      bufferDamping: 0.1,
    });
    expect(noHit).toBe(false);
  });
});
