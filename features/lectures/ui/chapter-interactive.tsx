"use client";

import {
  Component,
  createContext,
  use,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CanvasRuntimeContext } from "@/core/canvas/runtime";
import {
  useAnimationPlayback,
  useReducedMotionPreference,
} from "@/core/canvas/playback";
import {
  replaceSearchParams,
  useSearchParam,
} from "@/core/navigation/search-params";
import {
  isAnimatedModule,
  moduleRegistry,
  preloadModule,
} from "../interactive/registry";
import {
  normalizeParameterValue,
  parameterPrecision,
} from "../interactive/params";
import type { ChapterExperiment } from "../interactive-map";

type ChapterInteractiveContextValue = {
  experiments: ChapterExperiment[];
  selectedExperiment: ChapterExperiment;
  params: Record<string, number>;
  selectExperiment: (experimentId: string) => void;
  updateParam: (paramId: string, value: number) => void;
  resetParams: () => void;
};

const ChapterInteractiveContext =
  createContext<ChapterInteractiveContextValue | null>(null);

class ExperimentModuleBoundary extends Component<
  { children: ReactNode; experimentId: string },
  { error: Error | null }
> {
  state = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(`[experiment:${this.props.experimentId}]`, error);
  }

  render() {
    if (this.state.error) {
      return (
        <ExperimentFailure
          onRetry={() => this.setState({ error: null })}
          message="This experiment could not load."
        />
      );
    }
    return this.props.children;
  }
}

function ExperimentFailure({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="grid h-[250px] place-items-center rounded-2xl border border-rose-900/15 bg-rose-50 p-6 text-center sm:h-[320px]"
      role="alert"
    >
      <div>
        <p className="text-sm font-medium text-rose-900">{message}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 min-h-11 rounded-full border border-rose-900/20 bg-white px-4 py-2 text-sm font-semibold text-rose-900 transition-colors hover:border-rose-900/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
        >
          Retry experiment
        </button>
      </div>
    </div>
  );
}

function resolveExperimentId(
  experiments: ChapterExperiment[],
  candidate?: string,
) {
  return experiments.some((experiment) => experiment.id === candidate)
    ? candidate
    : experiments[0]?.id;
}

function useChapterInteractive() {
  const context = use(ChapterInteractiveContext);
  if (!context) {
    throw new Error("ChapterInteractive compound components require provider");
  }
  return context;
}

export function ChapterInteractive({
  experiments,
}: {
  experiments: ChapterExperiment[];
}) {
  const defaultExperiment = experiments[0]?.id;
  const activeExperimentId = useSearchParam("experiment") ?? undefined;
  const selectedExperimentId = resolveExperimentId(
    experiments,
    activeExperimentId,
  );
  const [paramsByExperiment, setParamsByExperiment] = useState<
    Record<string, Record<string, number>>
  >(() => {
    const initial: Record<string, Record<string, number>> = {};
    experiments.forEach((experiment) => {
      initial[experiment.id] = { ...experiment.params };
    });
    return initial;
  });

  const selectedExperiment = useMemo(
    () =>
      experiments.find(
        (experiment) => experiment.id === selectedExperimentId,
      ) ?? experiments[0],
    [experiments, selectedExperimentId],
  );

  const updateUrl = (nextExperiment?: string) => {
    replaceSearchParams((params) => {
      if (nextExperiment && nextExperiment !== defaultExperiment) {
        params.set("experiment", nextExperiment);
      } else {
        params.delete("experiment");
      }
      params.delete("module");
      params.delete("preset");
    });
  };

  const selectExperiment = (experimentId: string) => {
    if (experimentId === selectedExperiment?.id) return;
    updateUrl(experimentId);
  };

  const updateParam = (paramId: string, value: number) => {
    if (!selectedExperiment) return;
    const meta = selectedExperiment.paramMeta.find(
      (param) => param.id === paramId,
    );
    if (!meta) return;
    const fallback = selectedExperiment.params[paramId] ?? meta.min;
    const normalized = normalizeParameterValue(meta, value, fallback);
    setParamsByExperiment((prev) => ({
      ...prev,
      [selectedExperiment.id]: {
        ...prev[selectedExperiment.id],
        [paramId]: normalized,
      },
    }));
  };

  const resetParams = () => {
    if (!selectedExperiment) return;
    setParamsByExperiment((prev) => ({
      ...prev,
      [selectedExperiment.id]: { ...selectedExperiment.params },
    }));
  };

  if (!selectedExperiment) return null;

  const params =
    paramsByExperiment[selectedExperiment.id] ?? selectedExperiment.params;

  const contextValue: ChapterInteractiveContextValue = {
    experiments,
    selectedExperiment,
    params,
    selectExperiment,
    updateParam,
    resetParams,
  };

  return (
    <ChapterInteractiveContext value={contextValue}>
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-14 sm:pb-20">
        <InteractiveHeader />
        <ExperimentTabs />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <ExperimentStage key={selectedExperiment.id} />
          <ExperimentSidebar />
        </div>
      </section>
    </ChapterInteractiveContext>
  );
}

function InteractiveHeader() {
  const { selectedExperiment } = useChapterInteractive();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold tracking-[0.08em] text-slate-500">
          <span className="uppercase">Interactive experiment</span>
          <span className="rounded-full border border-slate-900/10 bg-white/70 px-2.5 py-1 text-[11px] font-medium tracking-normal text-slate-500">
            Qualitative model
          </span>
        </div>
        <h2 className="mt-3 font-[family:var(--font-display)] text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
          {selectedExperiment.title}
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
          {selectedExperiment.description}
        </p>
      </div>
    </div>
  );
}

function ExperimentTabs() {
  const { experiments, selectedExperiment, selectExperiment } =
    useChapterInteractive();
  const reducedMotion = useReducedMotionPreference();

  useEffect(() => {
    document
      .getElementById(`${selectedExperiment.id}-tab`)
      ?.scrollIntoView({
        behavior: reducedMotion ? "auto" : "smooth",
        block: "nearest",
        inline: "center",
      });
  }, [reducedMotion, selectedExperiment.id]);

  useEffect(() => {
    const currentIndex = experiments.findIndex(
      (experiment) => experiment.id === selectedExperiment.id,
    );
    const nextExperiment =
      experiments[(currentIndex + 1) % Math.max(1, experiments.length)];
    if (
      !nextExperiment ||
      nextExperiment.module === selectedExperiment.module
    ) {
      return;
    }

    const idleWindow = window as unknown as {
      requestIdleCallback?: (callback: IdleRequestCallback) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(() => {
        void preloadModule(nextExperiment.module);
      });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }

    const timeoutId = globalThis.setTimeout(() => {
      void preloadModule(nextExperiment.module);
    }, 800);
    return () => globalThis.clearTimeout(timeoutId);
  }, [experiments, selectedExperiment.id, selectedExperiment.module]);

  const moveSelection = (index: number, key: string) => {
    let nextIndex = index;
    if (key === "ArrowRight") nextIndex = (index + 1) % experiments.length;
    if (key === "ArrowLeft") {
      nextIndex = (index - 1 + experiments.length) % experiments.length;
    }
    if (key === "Home") nextIndex = 0;
    if (key === "End") nextIndex = experiments.length - 1;
    const nextExperiment = experiments[nextIndex];
    if (!nextExperiment || nextIndex === index) return;
    selectExperiment(nextExperiment.id);
    requestAnimationFrame(() => {
      document.getElementById(`${nextExperiment.id}-tab`)?.focus();
    });
  };

  return (
    <div
      className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="tablist"
      aria-label="Chapter experiments"
    >
      {experiments.map((experiment, index) => (
        <button
          key={experiment.id}
          onClick={() => selectExperiment(experiment.id)}
          onPointerEnter={() => void preloadModule(experiment.module)}
          onFocus={() => void preloadModule(experiment.module)}
          className={`min-h-11 shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 ${
            selectedExperiment.id === experiment.id
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-slate-900/10 bg-white/70 text-slate-600 hover:border-slate-900/30 hover:text-slate-950"
          }`}
          id={`${experiment.id}-tab`}
          type="button"
          role="tab"
          aria-selected={selectedExperiment.id === experiment.id}
          tabIndex={selectedExperiment.id === experiment.id ? 0 : -1}
          aria-controls="chapter-experiment-stage"
          onKeyDown={(event) => {
            if (
              ["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)
            ) {
              event.preventDefault();
              moveSelection(index, event.key);
            }
          }}
        >
          {experiment.title}
        </button>
      ))}
    </div>
  );
}

function ExperimentStage() {
  const { selectedExperiment, params } = useChapterInteractive();
  const ActiveModule = moduleRegistry[selectedExperiment.module];
  const animated = isAnimatedModule(selectedExperiment.module);
  const { paused, followsSystemPreference, toggle, useSystemPreference } =
    useAnimationPlayback();
  const [runtimeError, setRuntimeError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);
  const runtimeControl = useMemo(
    () => ({
      paused: animated && paused,
      onError: setRuntimeError,
    }),
    [animated, paused],
  );

  const retryRuntime = () => {
    setRuntimeError(null);
    setAttempt((current) => current + 1);
  };

  return (
    <div
      id="chapter-experiment-stage"
      className="rounded-2xl border border-slate-900/10 bg-white/85 p-2 sm:rounded-[2rem] sm:p-3"
      role="tabpanel"
      aria-labelledby={`${selectedExperiment.id}-tab`}
    >
      {animated ? (
        <div className="mb-2 flex min-h-11 flex-wrap items-center justify-between gap-2 px-2 text-xs text-slate-600">
          <span aria-live="polite">
            {paused ? "Animation paused" : "Animation running"}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            {!followsSystemPreference ? (
              <button
                type="button"
                onClick={useSystemPreference}
                className="min-h-9 rounded-full px-3 py-1.5 font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
              >
                Use system setting
              </button>
            ) : null}
            <button
              type="button"
              onClick={toggle}
              aria-pressed={paused}
              className="min-h-9 rounded-full border border-slate-900/15 bg-white px-3 py-1.5 font-semibold text-slate-700 transition-colors hover:border-slate-900/30 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              {paused ? "Play" : "Pause"}
            </button>
          </div>
        </div>
      ) : null}
      {runtimeError ? (
        <ExperimentFailure
          message="The animation stopped safely after an unexpected model error."
          onRetry={retryRuntime}
        />
      ) : (
        <CanvasRuntimeContext value={runtimeControl}>
          <ExperimentModuleBoundary
            key={attempt}
            experimentId={selectedExperiment.id}
          >
            <ActiveModule params={params} />
          </ExperimentModuleBoundary>
        </CanvasRuntimeContext>
      )}
    </div>
  );
}

function ExperimentSidebar() {
  return (
    <aside
      className="flex flex-col gap-6 rounded-2xl border border-slate-900/10 bg-white/85 p-4 sm:rounded-[2rem] sm:p-6"
      aria-label="Experiment guide and controls"
    >
      <ExperimentHighlights />
      <ExperimentControls />
    </aside>
  );
}

function ExperimentHighlights() {
  const { selectedExperiment } = useChapterInteractive();

  return (
    <div className="grid gap-3">
      <div className="rounded-2xl border border-slate-900/10 bg-slate-50/70 p-4">
        <div className="text-sm font-semibold text-slate-700">Goal</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {selectedExperiment.goal}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-900/10 bg-slate-50/70 p-4">
        <div className="text-sm font-semibold text-slate-700">Observation</div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {selectedExperiment.observation}
        </p>
      </div>
    </div>
  );
}

function ExperimentControls() {
  const { selectedExperiment, params, updateParam, resetParams } =
    useChapterInteractive();

  return (
    <div className="flex flex-col gap-4">
      {selectedExperiment.paramMeta.map((param) => (
        <label key={param.id} className="flex flex-col gap-2">
          <span className="flex items-center justify-between gap-4 text-sm text-slate-600">
            <span className="font-medium text-slate-700">{param.label}</span>
            <span className="tabular-nums">
              {(
                params[param.id] ?? selectedExperiment.params[param.id]
              ).toFixed(parameterPrecision(param.step))}
              {param.unit ? ` ${param.unit}` : ""}
            </span>
          </span>
          <span>
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={params[param.id] ?? 0}
              onChange={(event) =>
                updateParam(param.id, Number(event.target.value))
              }
              className="experiment-range w-full"
            />
          </span>
        </label>
      ))}
      <button
        type="button"
        onClick={resetParams}
        className="min-h-11 rounded-full border border-slate-900/15 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-900/30 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
      >
        Reset experiment
      </button>
    </div>
  );
}
