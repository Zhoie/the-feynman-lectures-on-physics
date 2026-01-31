"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

export function HomeHero({ primaryHref }: { primaryHref: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-10 px-6 pb-10 pt-16 md:pb-16 md:pt-24">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col gap-6"
      >
        <div className="inline-flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-slate-600">
          <span className="h-[1px] w-12 bg-slate-400/70" />
          Interactive Atlas
        </div>
        <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-slate-950 md:text-6xl md:leading-tight font-[family:var(--font-display)]">
          The Feynman Lectures on Physics
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-700 md:text-lg">
          A living, navigable map of the lectures: volumes, chapters, and the
          handoffs between them. Designed for quick orientation, modern
          readability, and motion-guided focus.
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
        className="flex flex-wrap gap-4"
      >
        <Link
          href={primaryHref}
          className="group inline-flex items-center gap-3 rounded-full border border-slate-900/10 bg-white/70 px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:border-slate-900/30 hover:shadow-md"
        >
          Start with Volume I
          <span className="text-slate-500 transition group-hover:translate-x-1">
            →
          </span>
        </Link>
        <div className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.35em] text-slate-500">
          3 Volumes · 114 Chapters
        </div>
      </motion.div>
    </section>
  );
}
