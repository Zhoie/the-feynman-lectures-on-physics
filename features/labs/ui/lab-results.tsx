import { formatMetricValue } from "../lib/presentation";
import { statusPill } from "./lab-status";
import { LineChart } from "./line-chart";
import type { LabSnapshot } from "./use-lab-runtime";

function MetricGrid({ metrics }: { metrics: LabSnapshot["metrics"] }) {
  if (metrics.length === 0) return null;

  return (
    <section className="border-t border-slate-900/10 px-4 py-6 sm:px-6 xl:px-8">
      <h3 className="text-sm font-semibold text-slate-800">Live results</h3>
      <div className="mt-4 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,11rem),1fr))]">
        {metrics.map((metric) => (
          <div
            key={metric.id}
            className="rounded-2xl border border-slate-900/10 bg-white p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="text-sm text-slate-600">{metric.label}</span>
              {metric.status ? (
                <span className={statusPill(metric.status)}>
                  {metric.status}
                </span>
              ) : null}
            </div>
            <div className="mt-3 font-[family:var(--font-display)] text-2xl font-semibold tabular-nums text-slate-950">
              {formatMetricValue(metric)}
              {metric.unit ? (
                <span className="ml-1 font-[family:var(--font-body)] text-sm font-normal text-slate-500">
                  {metric.unit}
                </span>
              ) : null}
            </div>
            {metric.reference !== undefined ? (
              <div className="mt-2 text-xs text-slate-500">
                Reference {metric.reference}
                {metric.tolerance !== undefined
                  ? ` · tolerance ±${metric.tolerance}`
                  : ""}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

function ChartGrid({ charts }: { charts: LabSnapshot["charts"] }) {
  if (charts.length === 0) return null;

  return (
    <section className="border-t border-slate-900/10 px-4 py-6 sm:px-6 xl:px-8">
      <h3 className="text-sm font-semibold text-slate-800">Model traces</h3>
      <div
        className={`mt-4 grid gap-4 ${
          charts.length > 1 ? "lg:grid-cols-2" : ""
        }`}
      >
        {charts.map((chart) => (
          <LineChart key={chart.id} chart={chart} />
        ))}
      </div>
    </section>
  );
}

export function LabResults({ snapshot }: { snapshot: LabSnapshot }) {
  return (
    <>
      <MetricGrid metrics={snapshot.metrics} />
      <ChartGrid charts={snapshot.charts} />
    </>
  );
}
