"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Chapter } from "../data";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function ChapterGrid({
  volumeId,
  chapters,
  accent,
}: {
  volumeId: string;
  chapters: Chapter[];
  accent: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <motion.ul
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        style={{ "--accent": accent } as CSSProperties}
      >
        {chapters.map((chapter) => (
          <motion.li key={chapter.slug} variants={itemVariants}>
            <Link
              href={`/volume/${volumeId}/${chapter.slug}`}
              className="group block h-full"
            >
              <motion.div
                whileHover={reduceMotion ? {} : { y: -4 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                className="relative flex h-full flex-col gap-3 rounded-xl border border-slate-900/10 bg-white/75 p-4 shadow-sm backdrop-blur transition-shadow group-hover:shadow-md"
              >
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {chapter.label}
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {chapter.title}
                </div>
                <div className="text-xs uppercase tracking-[0.3em] text-[color:var(--accent)]">
                  Enter
                </div>
              </motion.div>
            </Link>
          </motion.li>
        ))}
      </motion.ul>
    </section>
  );
}
