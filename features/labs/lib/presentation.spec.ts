import { describe, expect, it } from "vitest";
import {
  createDefaultLabParams,
  formatMetricValue,
  normalizeLabControlValue,
} from "./presentation";

describe("laboratory presentation values", () => {
  it("builds valid defaults and clamps range input", () => {
    const param = {
      id: "speed",
      label: "Speed",
      type: "range" as const,
      min: 0,
      max: 10,
      step: 0.1,
      default: 14,
    };
    expect(createDefaultLabParams([param])).toEqual({ speed: 10 });
    expect(normalizeLabControlValue(param, -2)).toBe(0);
    expect(normalizeLabControlValue(param, Number.NaN, 4)).toBe(4);
  });

  it("restores declared defaults for every control", () => {
    const defaults = createDefaultLabParams([
      { id: "mass", label: "Mass", min: 1, max: 5, default: 3 },
      {
        id: "mode",
        label: "Mode",
        type: "select",
        default: 2,
        options: [
          { label: "One", value: 1 },
          { label: "Two", value: 2 },
        ],
      },
    ]);
    expect(defaults).toEqual({ mass: 3, mode: 2 });
  });

  it("formats non-finite metrics as unavailable", () => {
    expect(formatMetricValue({ id: "x", label: "X", value: Number.NaN })).toBe(
      "Unavailable"
    );
    expect(formatMetricValue({ id: "x", label: "X", value: -0, precision: 2 })).toBe(
      "0.00"
    );
  });
});
