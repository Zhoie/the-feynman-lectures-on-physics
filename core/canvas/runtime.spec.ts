import { describe, expect, it } from "vitest";
import {
  clampFrameDelta,
  normalizeAnimationError,
  normalizePixelRatio,
} from "./runtime";

describe("canvas runtime normalization", () => {
  it("limits expensive device pixel ratios", () => {
    expect(normalizePixelRatio(3)).toBe(2);
    expect(normalizePixelRatio(1.5)).toBe(1.5);
    expect(normalizePixelRatio(Number.NaN)).toBe(1);
  });

  it("clamps pauses and rejects invalid frame times", () => {
    expect(clampFrameDelta(1)).toBeCloseTo(1 / 12, 10);
    expect(clampFrameDelta(1 / 60)).toBeCloseTo(1 / 60, 10);
    expect(clampFrameDelta(-1)).toBe(0);
  });

  it("normalizes non-error animation failures", () => {
    const existing = new Error("draw failed");
    expect(normalizeAnimationError(existing)).toBe(existing);
    expect(normalizeAnimationError("failed").message).toContain(
      "canvas animation",
    );
  });
});
