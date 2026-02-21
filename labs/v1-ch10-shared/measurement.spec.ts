import { describe, expect, it } from "vitest";
import {
  createMulberry32,
  createSensorState,
  seriesRmsResidual,
  updateSensor,
} from "./measurement";

describe("v1-ch10-shared measurement", () => {
  it("sensor output converges under low-pass sampling", () => {
    const random = createMulberry32(7);
    const state = createSensorState(0);
    const cfg = {
      sampleHz: 100,
      smoothing: 0.25,
      noiseStd: 0,
      offset: 0,
    };
    let output = 0;
    for (let i = 0; i < 80; i += 1) {
      output = updateSensor(state, 10, 0.01, cfg, random);
    }
    expect(output).toBeGreaterThan(9.5);
    expect(output).toBeLessThan(10.1);
  });

  it("rms residual is near zero for identical series", () => {
    const sim = [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ];
    const ref = [
      { x: 0, y: 1, uncertainty: 0.1 },
      { x: 1, y: 2, uncertainty: 0.1 },
      { x: 2, y: 3, uncertainty: 0.1 },
    ];
    expect(seriesRmsResidual(sim, ref)).toBeLessThan(1e-10);
  });
});
