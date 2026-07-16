import { describe, expect, it } from "vitest";
import { phaseExchangeRates } from "./phase-exchange";

describe("phase exchange model", () => {
  it("increases evaporation with heat and decreases it with humidity", () => {
    const cool = phaseExchangeRates({ temperature: 0.4, humidity: 0.2, salt: 0.1 });
    const hot = phaseExchangeRates({ temperature: 1.6, humidity: 0.2, salt: 0.1 });
    const humid = phaseExchangeRates({ temperature: 1.6, humidity: 0.7, salt: 0.1 });
    expect(hot.evaporation).toBeGreaterThan(cool.evaporation);
    expect(humid.evaporation).toBeLessThan(hot.evaporation);
  });

  it("reduces dissolution as salt approaches saturation", () => {
    const dilute = phaseExchangeRates({ temperature: 1, humidity: 0.3, salt: 0.1 });
    const salty = phaseExchangeRates({ temperature: 1, humidity: 0.3, salt: 0.85 });
    expect(salty.dissolution).toBeLessThan(dilute.dissolution);
  });
});
