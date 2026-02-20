"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { setupCanvas, useCanvasSize } from "@/features/lectures/interactive/core/canvas";
import {
  createSimLoopState,
  normalizeSimulationConfig,
  stepFixedSimulation,
} from "../core/sim-loop";
import type {
  ChartSpec,
  LabModel,
  MetricValue,
  ModelMeta,
  ValidationResult,
} from "../types";
import { LineChart } from "./line-chart";

type LabShellProps = {
  model: LabModel<any, any>;
};

const DEFAULT_META: ModelMeta = {
  fidelity: "qualitative",
  assumptions: ["Model assumptions are not yet documented for this lab."],
  validRange: ["Use control ranges shown in the UI."],
  sources: [],
  notes: "Validation defaults to runtime consistency checks only.",
};

function statusPill(status?: "ok" | "warn" | "fail") {
  if (status === "fail") {
    return "rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-rose-700";
  }
  if (status === "warn") {
    return "rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-700";
  }
  return "rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700";
}

function formatMetric(metric: MetricValue) {
  if (typeof metric.value !== "number") return `${metric.value}`;
  const precision = metric.precision ?? 3;
  return metric.value.toFixed(precision);
}

export function LabShell({ model }: LabShellProps) {
  const defaultParams = useMemo(() => {
    return model.params.reduce<Record<string, number>>((acc, param) => {
      const fallback =
        typeof param.default === "number"
          ? param.default
          : param.options?.[0]?.value ?? 0;
      acc[param.id] = fallback;
      return acc;
    }, {});
  }, [model]);

  const [params, setParams] = useState<Record<string, number>>(defaultParams);
  const [metrics, setMetrics] = useState<MetricValue[]>([]);
  const [charts, setCharts] = useState<ChartSpec[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [resetToken, setResetToken] = useState(0);
  const { canvasRef, width, height, dpr } = useCanvasSize({ height: 360 });

  const stateRef = useRef<unknown>(null);
  const loopStateRef = useRef(createSimLoopState());
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);
  const simulation = useMemo(
    () => normalizeSimulationConfig(model.simulation),
    [model.simulation]
  );
  const meta = model.meta ?? DEFAULT_META;

  useEffect(() => {
    setParams(defaultParams);
    setResetToken((token) => token + 1);
  }, [defaultParams]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0 || height === 0) return;
    const ctx = setupCanvas(canvas, width, height, dpr);
    if (!ctx) return;

    stateRef.current = model.create(params);
    loopStateRef.current = createSimLoopState();
    setMetrics(model.metrics(stateRef.current, params));
    setCharts(model.charts ? model.charts(stateRef.current, params) : []);
    setValidation(
      model.validate
        ? model.validate(stateRef.current, params)
        : {
            status: "ok",
            checks: [],
            warnings: ["Model-level quantitative validation is not configured yet."],
          }
    );

    let frameCount = 0;
    let active = true;
    lastTimeRef.current = null;

    const loop = (now: number) => {
      if (!active) return;
      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
      }
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;
      const result = stepFixedSimulation(
        loopStateRef.current,
        dt,
        simulation,
        (fixedDt) => {
          model.step(stateRef.current, params, fixedDt);
        }
      );
      loopStateRef.current = result.state;
      model.draw(ctx, stateRef.current, params, { width, height, dpr });
      if (frameCount % 6 === 0) {
        setMetrics(model.metrics(stateRef.current, params));
        setCharts(model.charts ? model.charts(stateRef.current, params) : []);
        setValidation(
          model.validate
            ? model.validate(stateRef.current, params)
            : {
                status: "ok",
                checks: [],
                warnings: ["Model-level quantitative validation is not configured yet."],
              }
        );
      }
      frameCount += 1;
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [canvasRef, width, height, dpr, model, params, resetToken, simulation]);

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-900/10 bg-white/80 p-6 shadow-sm">
      <header className="flex flex-col gap-2">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {model.archetype}
        </div>
        <h2 className="text-2xl font-semibold text-slate-900">{model.title}</h2>
        <p className="max-w-3xl text-sm leading-6 text-slate-600">
          {model.summary}
        </p>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-slate-900/10 bg-slate-900/5 p-3">
          <canvas
            ref={canvasRef}
            className="h-full w-full rounded-2xl bg-white"
            style={{ touchAction: "none" }}
          />
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-900/10 bg-white/70 p-4">
          <div className="flex items-center justify-between">
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Controls
            </div>
            <button
              type="button"
              onClick={() => setResetToken((token) => token + 1)}
              className="rounded-full border border-slate-900/10 px-3 py-1 text-xs text-slate-600 hover:border-slate-900/30"
            >
              Reset
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {model.params.map((param) => {
              const fallback =
                typeof param.default === "number"
                  ? param.default
                  : param.options?.[0]?.value ?? 0;
              const rawValue = params[param.id];
              const value = Number.isFinite(rawValue) ? rawValue : fallback;
              const controlType = param.type ?? "range";
              if (param.visibleWhen && !param.visibleWhen(params)) {
                return null;
              }
              if (controlType === "select" && param.options) {
                return (
                  <label key={param.id} className="flex flex-col gap-2 text-sm">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>{param.label}</span>
                      <span>
                        {Number.isFinite(value) ? value.toFixed(3) : "—"}
                        {param.unit ? ` ${param.unit}` : ""}
                      </span>
                    </div>
                    <select
                      value={value}
                      onChange={(event) =>
                        setParams((prev) => ({
                          ...prev,
                          [param.id]: Number(event.target.value),
                        }))
                      }
                      className="rounded-lg border border-slate-900/10 bg-white px-2 py-1 text-sm text-slate-700"
                    >
                      {param.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                );
              }

              return (
                <label key={param.id} className="flex flex-col gap-2 text-sm">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{param.label}</span>
                    <span>
                      {Number.isFinite(value) ? value.toFixed(3) : "—"}
                      {param.unit ? ` ${param.unit}` : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={param.min}
                    max={param.max}
                    step={param.step}
                    value={value}
                    onChange={(event) =>
                      setParams((prev) => ({
                        ...prev,
                        [param.id]: Number(event.target.value),
                      }))
                    }
                    className="w-full accent-slate-900"
                  />
                </label>
              );
            })}
          </div>
        </div>
        <div className="flex flex-col gap-4 rounded-2xl border border-slate-900/10 bg-white/70 p-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Metrics
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600">
              {metrics.map((metric) => (
                <div
                  key={metric.id}
                  className="rounded-xl border border-slate-900/5 bg-white/70 p-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600">{metric.label}</span>
                    {metric.status ? (
                      <span className={statusPill(metric.status)}>{metric.status}</span>
                    ) : null}
                  </div>
                  <div className="mt-1 flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {formatMetric(metric)}
                      {metric.unit ? ` ${metric.unit}` : ""}
                    </span>
                    {metric.reference !== undefined ? (
                      <span className="text-[11px] text-slate-500">
                        ref {metric.reference}
                        {metric.tolerance !== undefined ? ` ± ${metric.tolerance}` : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-slate-900/10 bg-slate-50/80 p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Model Confidence
              </div>
              <span className={statusPill(validation?.status ?? "ok")}>
                {validation?.status ?? "ok"}
              </span>
            </div>
            <div className="mt-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">Fidelity</div>
              <div className="mt-1 uppercase tracking-[0.2em] text-slate-500">
                {meta.fidelity}
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">Assumptions</div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {meta.assumptions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="mt-3 text-xs text-slate-600">
              <div className="font-semibold text-slate-700">Valid Range</div>
              <ul className="mt-1 list-disc space-y-1 pl-4">
                {meta.validRange.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {validation?.checks.length ? (
              <div className="mt-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-700">Checks</div>
                <div className="mt-2 grid gap-2">
                  {validation.checks.map((check) => (
                    <div
                      key={check.id}
                      className="rounded-lg border border-slate-900/10 bg-white/80 p-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span>{check.label}</span>
                        <span className={statusPill(check.status)}>{check.status}</span>
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">
                        value {check.value}
                        {check.reference !== undefined ? ` · ref ${check.reference}` : ""}
                        {check.tolerance !== undefined ? ` · tol ${check.tolerance}` : ""}
                      </div>
                      {check.message ? (
                        <div className="mt-1 text-[11px] text-slate-500">{check.message}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {validation?.warnings?.length ? (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-700">
                {validation.warnings.join(" ")}
              </div>
            ) : null}
            {meta.sources.length ? (
              <div className="mt-3 text-xs text-slate-600">
                <div className="font-semibold text-slate-700">Sources</div>
                <ul className="mt-1 list-disc space-y-1 pl-4">
                  {meta.sources.map((source) => (
                    <li key={`${source.kind}-${source.url}`}>
                      <a
                        href={source.url}
                        className="text-sky-700 underline decoration-dotted"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {source.label}
                      </a>{" "}
                      <span className="text-slate-500">
                        ({source.kind}
                        {source.status ? ` · ${source.status}` : ""})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {meta.notes ? (
              <div className="mt-3 text-xs text-slate-500">{meta.notes}</div>
            ) : null}
            <div className="mt-3 text-[11px] text-slate-500">
              fixed dt: {simulation.fixedDt.toFixed(4)} s · max substeps:{" "}
              {simulation.maxSubSteps}
            </div>
          </div>
        </div>
      </div>

      {charts.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {charts.map((chart) => (
            <LineChart key={chart.id} chart={chart} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
