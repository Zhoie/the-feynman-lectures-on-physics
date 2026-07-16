import { describe, expect, it } from "vitest";
import {
  reactionCoordinateSummary,
  reactionPotential,
  type ReactionCoordinateParams,
} from "./reaction-coordinate";

const base: ReactionCoordinateParams = {
  barrier: 1.6,
  reactionEnergy: -0.2,
  temperature: 0.6,
  catalyst: 0,
};

describe("reaction coordinate model", () => {
  it("keeps endpoint energies unchanged when a catalyst is added", () => {
    const uncatalyzed = { ...base, catalyst: 0 };
    const catalyzed = { ...base, catalyst: 1 };
    expect(reactionPotential(-1, catalyzed)).toBeCloseTo(
      reactionPotential(-1, uncatalyzed),
      12
    );
    expect(reactionPotential(1, catalyzed)).toBeCloseTo(
      reactionPotential(1, uncatalyzed),
      12
    );
  });

  it("lowers activation energy and raises crossing likelihood", () => {
    const uncatalyzed = reactionCoordinateSummary({ ...base, catalyst: 0 });
    const catalyzed = reactionCoordinateSummary({ ...base, catalyst: 1 });
    expect(catalyzed.forwardBarrier).toBeLessThan(uncatalyzed.forwardBarrier);
    expect(catalyzed.crossingLikelihood).toBeGreaterThan(
      uncatalyzed.crossingLikelihood
    );
  });

  it("raises crossing likelihood monotonically with temperature", () => {
    const cool = reactionCoordinateSummary({ ...base, temperature: 0.3 });
    const hot = reactionCoordinateSummary({ ...base, temperature: 1.2 });
    expect(hot.crossingLikelihood).toBeGreaterThan(cool.crossingLikelihood);
  });
});
