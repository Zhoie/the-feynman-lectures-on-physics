import { describe, expect, it } from "vitest";
import { normalizeParameterValue, parameterPrecision } from "./params";

const param = {
  id: "temperature",
  label: "Temperature",
  min: 0.2,
  max: 2,
  step: 0.05,
};

describe("experiment parameters", () => {
  it("clamps finite values and replaces invalid values", () => {
    expect(normalizeParameterValue(param, 3, 0.8)).toBe(2);
    expect(normalizeParameterValue(param, -1, 0.8)).toBe(0.2);
    expect(normalizeParameterValue(param, Number.NaN, 0.8)).toBe(0.8);
  });

  it("uses step size to choose readable precision", () => {
    expect(parameterPrecision(1)).toBe(0);
    expect(parameterPrecision(0.05)).toBe(2);
    expect(parameterPrecision(0.001)).toBe(3);
  });
});
