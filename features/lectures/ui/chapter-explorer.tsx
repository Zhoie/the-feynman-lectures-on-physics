"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { CSSProperties } from "react";
import type { Chapter, Volume } from "../data";
import type { ChapterPanel } from "../content";

const panelVariants = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function ChapterExplorer({
  volume,
  chapter,
  panels,
  activePanel,
}: {
  volume: Volume;
  chapter: Chapter;
  panels: ChapterPanel[];
  activePanel: ChapterPanel["id"];
}) {
  const reduceMotion = useReducedMotion();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const defaultPanel = panels[0]?.id ?? "intuition";
  const normalizedPanel = panels.some((panel) => panel.id === activePanel)
    ? activePanel
    : defaultPanel;
  const [active, setActive] = useState(normalizedPanel);

  useEffect(() => {
    setActive(normalizedPanel);
  }, [normalizedPanel]);

  const activeCard =
    panels.find((panel) => panel.id === active) ?? panels[0];

  const updatePanel = (panelId: ChapterPanel["id"]) => {
    setActive(panelId);
    const params = new URLSearchParams(searchParams.toString());
    if (panelId === defaultPanel) {
      params.delete("panel");
    } else {
      params.set("panel", panelId);
    }
    const query = params.toString();
    const href = query ? `${pathname}?${query}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return (
    <section
      className="mx-auto grid max-w-6xl gap-8 px-6 pb-16 md:grid-cols-[1.1fr_1fr]"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <div className="relative overflow-hidden rounded-3xl border border-slate-900/10 bg-white/80 p-8 shadow-sm backdrop-blur">
        <motion.div
          initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative flex h-full flex-col items-start justify-between gap-6"
        >
          <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
            Interactive field
          </div>
          <div className="relative h-56 w-full">
            <motion.div
              className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[color:var(--accent)]/40"
              animate={
                reduceMotion
                  ? {}
                  : {
                      scale: [0.96, 1.02, 0.98],
                      opacity: [0.7, 1, 0.8],
                    }
              }
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_top,color-mix(in_srgb,var(--accent)_55%,transparent),transparent_70%)]"
              animate={
                reduceMotion
                  ? {}
                  : {
                      rotate: 360,
                    }
              }
              transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-900/10"
              animate={
                reduceMotion
                  ? {}
                  : {
                      rotate: -360,
                    }
              }
              transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
            />
          </div>
          <div className="text-sm leading-6 text-slate-600">
            Drift through the field lines. Motion cues highlight where the
            energy concentrates in this chapter.
          </div>
        </motion.div>
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-2">
          {panels.map((panel) => (
            <button
              key={panel.id}
              onClick={() => updatePanel(panel.id)}
              className={`rounded-full border px-4 py-2 text-xs uppercase tracking-[0.3em] transition ${
                active === panel.id
                  ? "border-[color:var(--accent)] text-[color:var(--accent)]"
                  : "border-slate-900/10 text-slate-500 hover:border-slate-900/30"
              }`}
              type="button"
              aria-pressed={active === panel.id}
            >
              {panel.label}
            </button>
          ))}
          {isPending ? (
            <span className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Updating
            </span>
          ) : null}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCard?.id}
            variants={panelVariants}
            initial="hidden"
            animate="show"
            exit="hidden"
            className="rounded-2xl border border-slate-900/10 bg-white/80 p-6 shadow-sm"
          >
            <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
              {activeCard?.title}
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950 font-[family:var(--font-display)]">
              {chapter.title}
            </h3>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {activeCard?.text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
