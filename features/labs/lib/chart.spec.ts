import { describe, expect, it } from "vitest";
import { getChartDomain } from "./chart";

describe("chart domains", () => {
  it("ignores non-finite points", () => {
    expect(
      getChartDomain({
        id: "finite",
        title: "Finite",
        series: [
          {
            id: "series",
            label: "Series",
            data: [
              { x: 2, y: 4 },
              { x: Number.NaN, y: 100 },
              { x: 3, y: Number.POSITIVE_INFINITY },
              { x: 5, y: 8 },
            ],
          },
        ],
      })
    ).toEqual({ xMin: 2, xMax: 5, yMin: 4, yMax: 8 });
  });

  it("creates a visible range for constant data", () => {
    const domain = getChartDomain({
      id: "constant",
      title: "Constant",
      series: [{ id: "series", label: "Series", data: [{ x: 1, y: 2 }] }],
    });
    expect(domain.xMin).toBeLessThan(1);
    expect(domain.xMax).toBeGreaterThan(1);
    expect(domain.yMin).toBeLessThan(2);
    expect(domain.yMax).toBeGreaterThan(2);
  });
});
