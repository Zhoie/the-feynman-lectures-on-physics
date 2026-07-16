import type { ChartBandPoint, ChartPoint, ChartSpec } from "../types";

export type ChartDomain = {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

export function isFiniteChartPoint(point: ChartPoint) {
  return Number.isFinite(point.x) && Number.isFinite(point.y);
}

export function isFiniteBandPoint(point: ChartBandPoint) {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.yMin) &&
    Number.isFinite(point.yMax)
  );
}

function finiteRange(range: [number, number] | undefined) {
  return range &&
    Number.isFinite(range[0]) &&
    Number.isFinite(range[1]) &&
    range[1] > range[0]
    ? range
    : null;
}

function resolvedRange(values: number[], requested?: [number, number]) {
  const validRequested = finiteRange(requested);
  if (validRequested) return validRequested;
  if (!values.length) return [0, 1] as [number, number];
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  if (minimum === maximum) {
    const padding = Math.max(1, Math.abs(minimum) * 0.05);
    return [minimum - padding, maximum + padding] as [number, number];
  }
  return [minimum, maximum] as [number, number];
}

export function getChartDomain(chart: ChartSpec): ChartDomain {
  const points = chart.series.flatMap((series) =>
    series.data.filter(isFiniteChartPoint)
  );
  const bands =
    chart.bands?.flatMap((band) => band.data.filter(isFiniteBandPoint)) ?? [];
  const [xMin, xMax] = resolvedRange(
    points.map((point) => point.x).concat(bands.map((point) => point.x)),
    chart.xRange
  );
  const [yMin, yMax] = resolvedRange(
    points
      .map((point) => point.y)
      .concat(bands.flatMap((point) => [point.yMin, point.yMax])),
    chart.yRange
  );
  return { xMin, xMax, yMin, yMax };
}
