"use client";

import type { LabModel } from "../types";
import { LabControlPanel } from "./lab-control-panel";
import { LabResults } from "./lab-results";
import { statusPill } from "./lab-status";
import { ModelConfidence } from "./model-confidence";
import { useLabRuntime } from "./use-lab-runtime";

type LabShellProps = {
  model: LabModel<Record<string, number>, unknown>;
};

export function LabShell({ model }: LabShellProps) {
  const {
    animated,
    canvasRef,
    controls,
    defaultParams,
    height,
    meta,
    params,
    paused,
    reset,
    retry,
    runtimeError,
    simulation,
    snapshot,
    togglePlayback,
    updateParam,
    followsSystemPreference,
    useSystemPlaybackPreference,
  } = useLabRuntime(model);
  const validationStatus = snapshot.validation?.status ?? "warn";
  const validationLabel = snapshot.validation?.status ?? "checking";

  return (
    <section
      className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white/85 sm:rounded-[2rem]"
      aria-labelledby={`${model.id}-title`}
    >
      <header className="flex flex-col gap-4 border-b border-slate-900/10 px-5 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {model.archetype}
          </div>
          <span className={statusPill(validationStatus)}>
            {validationLabel}
          </span>
        </div>
        <div>
          <h2
            id={`${model.id}-title`}
            className="font-[family:var(--font-display)] text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl"
          >
            {model.title}
          </h2>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
            {model.summary}
          </p>
        </div>
      </header>

      <div className="grid gap-5 p-3 sm:p-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.65fr)] xl:p-8">
        <div className="overflow-hidden rounded-3xl border border-slate-900/10 bg-slate-950/[0.035] p-2 sm:p-3">
          <div className="mb-2 flex min-h-11 flex-wrap items-center justify-between gap-2 px-2 py-1 text-xs font-semibold text-slate-600">
            <span>Live simulation</span>
            <div className="flex flex-wrap items-center gap-2 font-normal">
              <span aria-live="polite">
                {animated
                  ? paused
                    ? "Paused"
                    : "Frame-rate independent"
                  : "Static model"}
              </span>
              {animated && !followsSystemPreference ? (
                <button
                  type="button"
                  onClick={useSystemPlaybackPreference}
                  className="min-h-9 rounded-full px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-white hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Use system setting
                </button>
              ) : null}
              {animated ? (
                <button
                  type="button"
                  onClick={togglePlayback}
                  aria-pressed={paused}
                  className="min-h-9 rounded-full border border-slate-900/15 bg-white px-3 py-1.5 font-semibold text-slate-700 transition-colors hover:border-slate-900/30 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  {paused ? "Play" : "Pause"}
                </button>
              ) : null}
            </div>
          </div>
          {runtimeError ? (
            <div
              className="grid place-items-center rounded-2xl border border-rose-900/15 bg-rose-50 p-6 text-center"
              style={{ height }}
              role="alert"
            >
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  The {runtimeError.phase} phase stopped safely.
                </p>
                <p className="mt-2 max-w-md text-sm leading-6 text-rose-800">
                  {runtimeError.message}
                </p>
                <button
                  type="button"
                  onClick={retry}
                  className="mt-4 min-h-11 rounded-full border border-rose-900/20 bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition-colors hover:border-rose-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
                >
                  Retry model
                </button>
              </div>
            </div>
          ) : (
            <canvas
              ref={canvasRef}
              className="w-full rounded-2xl bg-white"
              style={{ height, touchAction: "none" }}
              role="img"
              aria-label={`${model.title} simulation`}
            >
              {model.title} simulation.
            </canvas>
          )}
        </div>

        <LabControlPanel
          controls={controls}
          defaultParams={defaultParams}
          params={params}
          onChange={updateParam}
          onReset={reset}
        />
      </div>

      <LabResults snapshot={snapshot} />
      <ModelConfidence
        meta={meta}
        runtime={snapshot.runtime}
        simulation={simulation}
        validation={snapshot.validation}
      />
    </section>
  );
}
