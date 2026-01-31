"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Chapter, Volume } from "../data";

export function ChapterHero({
  volume,
  chapter,
}: {
  volume: Volume;
  chapter: Chapter;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-8 pt-16 md:pt-24"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="flex flex-col gap-5"
      >
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-slate-500">
          <span className="h-[1px] w-10 bg-slate-400/70" />
          {volume.title} · {chapter.label}
        </div>
        <h1 className="text-4xl font-semibold leading-tight text-slate-950 md:text-6xl md:leading-tight font-[family:var(--font-display)]">
          {chapter.title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600 md:text-lg">
          An interactive chapter brief with key ideas, experiments, and the
          minimal math scaffold that frames the lecture.
        </p>
        <div className="flex flex-wrap gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
          <span className="rounded-full border border-slate-900/10 px-4 py-2">
            {volume.subtitle}
          </span>
          <span className="rounded-full border border-[color:var(--accent)] px-4 py-2 text-[color:var(--accent)]">
            Motion-guided focus
          </span>
        </div>
      </motion.div>
    </section>
  );
}
