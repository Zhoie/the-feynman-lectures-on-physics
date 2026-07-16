export type PhaseExchangeParams = {
  temperature: number;
  humidity: number;
  salt: number;
};

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

function finiteOr(value: number, fallback: number) {
  return Number.isFinite(value) ? value : fallback;
}

export function phaseExchangeRates(params: PhaseExchangeParams) {
  const temperature = clamp01((finiteOr(params.temperature, 0.2) - 0.2) / 1.8);
  const humidity = clamp01((finiteOr(params.humidity, 0.05) - 0.05) / 0.75);
  const salt = clamp01(finiteOr(params.salt, 0) / 0.9);
  return {
    temperature,
    humidity,
    salt,
    evaporation: clamp01(
      temperature * (1 - humidity) * (1 - salt * 0.35)
    ),
    condensation: clamp01(humidity * (1 - temperature * 0.35)),
    dissolution: clamp01((0.25 + temperature * 0.75) * (1 - salt)),
  };
}
