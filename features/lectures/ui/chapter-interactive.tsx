"use client";

import {
  createContext,
  use,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { moduleRegistry } from "../interactive/registry";
import type { ChapterExperiment } from "../interactive-map";

type ChapterInteractiveContextValue = {
  experiments: ChapterExperiment[];
  selectedExperiment: ChapterExperiment;
  params: Record<string, number>;
  isPending: boolean;
  selectExperiment: (experimentId: string) => void;
  updateParam: (paramId: string, value: number) => void;
  resetParams: () => void;
};

const ChapterInteractiveContext =
  createContext<ChapterInteractiveContextValue | null>(null);

function useChapterInteractive() {
  const context = use(ChapterInteractiveContext);
  if (!context) {
    throw new Error("ChapterInteractive compound components require provider");
  }
  return context;
}

export function ChapterInteractive({
  experiments,
  activeExperimentId,
}: {
  experiments: ChapterExperiment[];
  activeExperimentId?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const defaultExperiment = experiments[0]?.id;
  const [localSelectedExperimentId, setLocalSelectedExperimentId] = useState<
    string | undefined
  >(activeExperimentId ?? defaultExperiment);
  const selectedExperimentId =
    activeExperimentId ?? localSelectedExperimentId ?? defaultExperiment;
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
      experiments.find((experiment) => experiment.id === selectedExperimentId) ??
      experiments[0],
    [experiments, selectedExperimentId]
  );

  const updateUrl = (nextExperiment?: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextExperiment && nextExperiment !== defaultExperiment) {
      params.set("experiment", nextExperiment);
    } else {
      params.delete("experiment");
    }
    params.delete("module");
    params.delete("preset");
    const next = params.toString();
    const href = next ? `${pathname}?${next}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  const selectExperiment = (experimentId: string) => {
    setLocalSelectedExperimentId(experimentId);
    updateUrl(experimentId);
  };

  const updateParam = (paramId: string, value: number) => {
    if (!selectedExperiment) return;
    setParamsByExperiment((prev) => ({
      ...prev,
      [selectedExperiment.id]: {
        ...prev[selectedExperiment.id],
        [paramId]: value,
      },
    }));
    updateUrl(selectedExperiment.id);
  };

  const resetParams = () => {
    if (!selectedExperiment) return;
    setParamsByExperiment((prev) => ({
      ...prev,
      [selectedExperiment.id]: { ...selectedExperiment.params },
    }));
    updateUrl(selectedExperiment.id);
  };

  if (!selectedExperiment) return null;

  const params =
    paramsByExperiment[selectedExperiment.id] ?? selectedExperiment.params;

  const contextValue: ChapterInteractiveContextValue = {
    experiments,
    selectedExperiment,
    params,
    isPending,
    selectExperiment,
    updateParam,
    resetParams,
  };

  return (
    <ChapterInteractiveContext value={contextValue}>
      <section className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-12 sm:pb-16">
        <InteractiveHeader />
        <ExperimentTabs />
        <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <ExperimentStage />
          <ExperimentSidebar />
        </div>
      </section>
    </ChapterInteractiveContext>
  );
}

function InteractiveHeader() {
  const { selectedExperiment, isPending } = useChapterInteractive();

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Interactive Experiments
        </div>
        <h3 className="mt-2 font-[family:var(--font-display)] text-2xl font-semibold text-slate-950">
          {selectedExperiment.title}
        </h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {selectedExperiment.description}
        </p>
      </div>
      {isPending ? (
        <div aria-live="polite" className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Updating...
        </div>
      ) : null}
    </div>
  );
}

function ExperimentTabs() {
  const { experiments, selectedExperiment, selectExperiment } =
    useChapterInteractive();

  return (
    <div className="flex flex-wrap gap-2">
      {experiments.map((experiment) => (
        <button
          key={experiment.id}
          onClick={() => selectExperiment(experiment.id)}
          className={`rounded-full border px-4 py-3 text-[11px] uppercase tracking-[0.3em] transition sm:py-2 sm:text-xs ${
            selectedExperiment.id === experiment.id
              ? "border-slate-900/60 text-slate-900"
              : "border-slate-900/10 text-slate-500 hover:border-slate-900/30"
          }`}
          type="button"
          aria-pressed={selectedExperiment.id === experiment.id}
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

  return (
    <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-3 shadow-sm backdrop-blur sm:p-4">
      <ActiveModule params={params} />
    </div>
  );
}

function ExperimentSidebar() {
  return (
    <div className="flex flex-col gap-5 rounded-3xl border border-slate-900/10 bg-white/80 p-4 shadow-sm backdrop-blur sm:p-6">
      <ExperimentHighlights />
      <ExperimentControls />
    </div>
  );
}

function ExperimentHighlights() {
  const { selectedExperiment } = useChapterInteractive();

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Goal
        </div>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          {selectedExperiment.goal}
        </p>
      </div>
      <div className="rounded-2xl border border-slate-900/10 bg-white/70 p-4">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Observation
        </div>
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
        <div key={param.id} className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
            <span>{param.label}</span>
            <span>
              {params[param.id]?.toFixed(2)}
              {param.unit ? ` ${param.unit}` : ""}
            </span>
          </div>
          <div className="py-1.5">
            <input
              type="range"
              min={param.min}
              max={param.max}
              step={param.step}
              value={params[param.id] ?? 0}
              onChange={(event) => updateParam(param.id, Number(event.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-slate-900"
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={resetParams}
        className="rounded-full border border-slate-900/10 px-4 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30 sm:py-2"
      >
        Reset experiment
      </button>
    </div>
  );
}
