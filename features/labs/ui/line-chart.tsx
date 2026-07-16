import type { ChartBandPoint, ChartSpec, ChartSeries } from "../types";
import {
  getChartDomain,
  isFiniteBandPoint,
  isFiniteChartPoint,
} from "../lib/chart";

const DEFAULT_COLORS = [
  "#0f172a",
  "#0284c7",
  "#0d9488",
  "#f97316",
  "#7c3aed",
];

type LineChartProps = {
  chart: ChartSpec;
  width?: number;
  height?: number;
};

function buildPath(
  series: ChartSeries,
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  width: number,
  height: number,
  padding: number
) {
  const points = series.data.filter(isFiniteChartPoint);
  if (!points.length || xMax === xMin || yMax === yMin) {
    return "";
  }
  const scaleX = (value: number) =>
    padding + ((value - xMin) / (xMax - xMin)) * (width - padding * 2);
  const scaleY = (value: number) =>
    height - padding - ((value - yMin) / (yMax - yMin)) * (height - padding * 2);
  return points
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function buildBandPath(
  points: ChartBandPoint[],
  xMin: number,
  xMax: number,
  yMin: number,
  yMax: number,
  width: number,
  height: number,
  padding: number
) {
  const finitePoints = points.filter(isFiniteBandPoint);
  if (!finitePoints.length || xMax === xMin || yMax === yMin) {
    return "";
  }
  const scaleX = (value: number) =>
    padding + ((value - xMin) / (xMax - xMin)) * (width - padding * 2);
  const scaleY = (value: number) =>
    height - padding - ((value - yMin) / (yMax - yMin)) * (height - padding * 2);

  const upper = finitePoints
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.yMax);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  const lower = [...finitePoints]
    .reverse()
    .map((point) => {
      const x = scaleX(point.x);
      const y = scaleY(point.yMin);
      return `L ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
  return `${upper} ${lower} Z`;
}

export function LineChart({ chart, width = 420, height = 180 }: LineChartProps) {
  const padding = 24;
  const { xMin, xMax, yMin, yMax } = getChartDomain(chart);

  return (
    <figure className="rounded-2xl border border-slate-900/10 bg-white/85 p-4">
      <figcaption className="text-sm font-semibold text-slate-700">
        {chart.title}
      </figcaption>
      <svg
        className="mt-3 w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${chart.title} chart`}
      >
        <rect
          x={0}
          y={0}
          width={width}
          height={height}
          fill="transparent"
        />
        <line
          x1={padding}
          y1={padding}
          x2={padding}
          y2={height - padding}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#cbd5e1"
          strokeWidth={1}
        />
        {chart.bands?.map((band, index) => {
          const path = buildBandPath(
            band.data,
            xMin,
            xMax,
            yMin,
            yMax,
            width,
            height,
            padding
          );
          if (!path) return null;
          const color = band.color ?? "rgba(14, 165, 233, 0.15)";
          return <path key={band.id ?? `band-${index}`} d={path} fill={color} />;
        })}
        {chart.series.map((series, index) => {
          const path = buildPath(
            series,
            xMin,
            xMax,
            yMin,
            yMax,
            width,
            height,
            padding
          );
          if (!path) return null;
          const color = series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
          return (
            <path
              key={series.id}
              d={path}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeDasharray={series.lineStyle === "dashed" ? "6 4" : undefined}
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
            />
          );
        })}
        {chart.xLabel ? (
          <text
            x={width - padding}
            y={height - 6}
            textAnchor="end"
            fontSize="12"
            fill="#64748b"
          >
            {chart.xLabel}
          </text>
        ) : null}
        {chart.yLabel ? (
          <text
            x={padding}
            y={12}
            textAnchor="start"
            fontSize="12"
            fill="#64748b"
          >
            {chart.yLabel}
          </text>
        ) : null}
      </svg>
      {chart.series.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
          {chart.series.map((series, index) => (
            <div key={series.id} className="flex items-center gap-2">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  backgroundColor:
                    series.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
                }}
              />
              <span>{series.label}</span>
              {series.role ? (
                <span className="text-xs uppercase tracking-[0.14em] text-slate-600">
                  {series.role}
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </figure>
  );
}
