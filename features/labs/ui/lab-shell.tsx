"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { setupCanvas, useCanvasSize } from "@/features/lectures/interactive/core/canvas";
import type { ChartSpec, LabModel, MetricValue } from "../types";
import { LineChart } from "./line-chart";

type LabShellProps = {
  model: LabModel<Record<string, number>, unknown>;
};

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
  const [resetToken, setResetToken] = useState(0);
  const { canvasRef, width, height, dpr } = useCanvasSize({ height: 360 });

  const stateRef = useRef<unknown>(null);
  const frameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number | null>(null);

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
    setMetrics(model.metrics(stateRef.current, params));
    setCharts(model.charts ? model.charts(stateRef.current, params) : []);

    let frameCount = 0;
    let active = true;
    lastTimeRef.current = null;

    const loop = (now: number) => {
      if (!active) return;
      if (!lastTimeRef.current) {
        lastTimeRef.current = now;
      }
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;
      model.step(stateRef.current, params, dt);
      model.draw(ctx, stateRef.current, params, { width, height, dpr });
      if (frameCount % 6 === 0) {
        setMetrics(model.metrics(stateRef.current, params));
        setCharts(model.charts ? model.charts(stateRef.current, params) : []);
      }
      frameCount += 1;
      frameRef.current = requestAnimationFrame(loop);
    };

    frameRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [canvasRef, width, height, dpr, model, params, resetToken]);

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

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
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
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Metrics
            </div>
            <div className="mt-3 grid gap-2 text-xs text-slate-600">
              {metrics.map((metric) => (
                <div key={metric.id} className="flex justify-between">
                  <span>{metric.label}</span>
                  <span className="font-medium text-slate-900">
                    {typeof metric.value === "number"
                      ? metric.value.toFixed(metric.precision ?? 3)
                      : metric.value}
                    {metric.unit ? ` ${metric.unit}` : ""}
                  </span>
                </div>
              ))}
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
