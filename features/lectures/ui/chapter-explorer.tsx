"use client";

import type { CSSProperties } from "react";
import {
  replaceSearchParams,
  useSearchParam,
} from "@/core/navigation/search-params";
import type { ChapterPanel } from "../content";

export function ChapterExplorer({
  accent,
  chapterSlug,
  chapterTitle,
  panels,
}: {
  accent: string;
  chapterSlug: string;
  chapterTitle: string;
  panels: ChapterPanel[];
}) {
  const activePanel = useSearchParam("panel");
  const defaultPanel = panels[0]?.id ?? "intuition";
  const active = panels.some((panel) => panel.id === activePanel)
    ? activePanel
    : defaultPanel;

  const activeCard = panels.find((panel) => panel.id === active) ?? panels[0];
  const activePanelId = `${chapterSlug}-${activeCard?.id ?? defaultPanel}-panel`;
  const statusId = `${chapterSlug}-panel-status`;

  const updatePanel = (panelId: ChapterPanel["id"]) => {
    replaceSearchParams((params) => {
      if (panelId === defaultPanel) {
        params.delete("panel");
      } else {
        params.set("panel", panelId);
      }
    });
  };

  return (
    <section
      className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 md:grid-cols-[1.1fr_1fr]"
      style={{ "--accent": accent } as CSSProperties}
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white/80 p-6 sm:p-8">
        <div className="relative flex h-full flex-col items-start justify-between gap-6">
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Interactive field
          </div>
          <div className="relative h-56 w-full">
            <div className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--accent)]/35 bg-[radial-gradient(circle_at_38%_32%,color-mix(in_srgb,var(--accent)_35%,white),transparent_62%)]" />
            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70 bg-white/25" />
            <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--accent)]" />
          </div>
          <div className="text-sm leading-6 text-slate-600">
            Use the chapter panels to connect physical intuition, experimental
            evidence, and the minimum mathematical model.
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => updatePanel(panel.id)}
              aria-describedby={statusId}
              className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] ${
                active === panel.id
                  ? "border-[color:var(--accent)] bg-white/80 text-[color:var(--accent)]"
                  : "border-slate-900/10 text-slate-500 hover:border-slate-900/30 hover:bg-white/70"
              }`}
              type="button"
              aria-pressed={active === panel.id}
            >
              {panel.label}
            </button>
          ))}
          <span
            id={statusId}
            role="status"
            aria-live="polite"
            className="text-sm text-slate-500"
          >
            {activeCard?.title}
          </span>
        </div>
        <div
          key={activeCard?.id}
          id={activePanelId}
          className="ui-panel-reveal rounded-2xl border border-slate-900/10 bg-white/80 p-5 sm:p-6"
        >
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            {activeCard?.title}
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-slate-950 font-[family:var(--font-display)]">
            {chapterTitle}
          </h3>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            {activeCard?.text}
          </p>
        </div>
      </div>
    </section>
  );
}
