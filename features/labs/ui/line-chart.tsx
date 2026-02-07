import type { ChartSpec, ChartSeries } from "../types";

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
  if (!series.data.length || xMax === xMin || yMax === yMin) {
    return "";
  }
  const scaleX = (value: number) =>
    padding + ((value - xMin) / (xMax - xMin)) * (width - padding * 2);
  const scaleY = (value: number) =>
    height - padding - ((value - yMin) / (yMax - yMin)) * (height - padding * 2);
  return series.data
    .map((point, index) => {
      const x = scaleX(point.x);
      const y = scaleY(point.y);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

export function LineChart({ chart, width = 280, height = 160 }: LineChartProps) {
  const padding = 24;
  const allPoints = chart.series.flatMap((series) => series.data);
  const xValues = allPoints.map((point) => point.x);
  const yValues = allPoints.map((point) => point.y);
  const xMin = chart.xRange?.[0] ?? Math.min(...xValues, 0);
  const xMax = chart.xRange?.[1] ?? Math.max(...xValues, 1);
  const yMin = chart.yRange?.[0] ?? Math.min(...yValues, 0);
  const yMax = chart.yRange?.[1] ?? Math.max(...yValues, 1);

  return (
    <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-4 shadow-sm">
      <div className="text-xs uppercase tracking-[0.28em] text-slate-400">
        {chart.title}
      </div>
      <svg
        className="mt-3 w-full"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={chart.title}
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
          stroke="#cbd5f5"
          strokeWidth={1}
        />
        <line
          x1={padding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#cbd5f5"
          strokeWidth={1}
        />
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
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          );
        })}
        {chart.xLabel ? (
          <text
            x={width - padding}
            y={height - 6}
            textAnchor="end"
            fontSize="10"
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
            fontSize="10"
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
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
