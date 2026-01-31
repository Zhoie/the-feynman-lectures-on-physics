"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Chapter, Volume } from "../data";

export function TransitionPanel({
  volume,
  from,
  to,
}: {
  volume: Volume;
  from: Chapter;
  to: Chapter;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section
      className="mx-auto flex max-w-5xl flex-col gap-10 px-6 pb-20 pt-16 md:pt-24"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <div className="flex flex-col gap-4">
        <div className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Transition
        </div>
        <h1 className="text-3xl font-semibold text-slate-950 md:text-5xl font-[family:var(--font-display)]">
          {from.title} → {to.title}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Bridge the concepts: carry the intuition from the previous lecture and
          prime the questions for the next.
        </p>
      </div>
      <div className="rounded-3xl border border-slate-900/10 bg-white/85 p-8 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, scaleX: reduceMotion ? 1 : 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-[2px] w-full origin-left bg-gradient-to-r from-transparent via-[color:var(--accent)] to-transparent"
          />
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-900/10 bg-slate-50/70 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Leaving
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-900">
                {from.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Summarize the key idea in one sentence. Identify the question
                that remains open.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-900/10 bg-slate-50/70 p-5">
              <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Arriving
              </div>
              <div className="mt-3 text-lg font-semibold text-slate-900">
                {to.title}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                List the tool you expect to need most. Note the experiment or
                equation you want to test.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <Link
              href={`/volume/${volume.id}/${from.slug}`}
              className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30"
            >
              Back to {from.label}
            </Link>
            <Link
              href={`/volume/${volume.id}/${to.slug}`}
              className="rounded-full border border-[color:var(--accent)] bg-white/80 px-5 py-3 text-xs uppercase tracking-[0.3em] text-[color:var(--accent)] shadow-sm transition hover:-translate-y-0.5"
            >
              Enter {to.label}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
