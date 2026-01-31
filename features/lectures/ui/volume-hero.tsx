"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Volume } from "../data";

export function VolumeHero({ volume }: { volume: Volume }) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="mx-auto flex max-w-6xl flex-col gap-8 px-6 pb-10 pt-16 md:pt-24"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col gap-6"
      >
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.4em] text-slate-500">
          <span className="h-[1px] w-10 bg-slate-400/70" />
          {volume.title}
        </div>
        <h1 className="text-4xl font-semibold leading-tight text-slate-950 md:text-6xl md:leading-tight font-[family:var(--font-display)]">
          {volume.subtitle}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
          {volume.summary}
        </p>
        <div className="flex flex-wrap gap-4 text-xs uppercase tracking-[0.3em] text-slate-500">
          <span className="rounded-full border border-slate-900/10 px-4 py-2">
            {volume.chapterRange}
          </span>
          <span className="rounded-full border border-slate-900/10 px-4 py-2">
            {volume.chapters.length} Chapters
          </span>
          <span className="rounded-full border border-[color:var(--accent)] px-4 py-2 text-[color:var(--accent)]">
            Field Notes
          </span>
        </div>
      </motion.div>
    </section>
  );
}
