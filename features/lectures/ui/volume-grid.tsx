"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties } from "react";
import type { Volume } from "../data";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export function VolumeGrid({ volumes }: { volumes: Volume[] }) {
  const reduceMotion = useReducedMotion();

  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-3"
      >
        {volumes.map((volume) => (
          <motion.div key={volume.id} variants={itemVariants}>
            <Link href={`/volume/${volume.id}`} className="group block h-full">
              <motion.div
                whileHover={reduceMotion ? {} : { y: -6 }}
                whileTap={reduceMotion ? {} : { scale: 0.98 }}
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-900/10 bg-white/80 p-6 shadow-sm backdrop-blur transition-shadow group-hover:shadow-lg"
                style={{ "--accent": volume.accent } as CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 [background-image:radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--accent)_25%,transparent),transparent_60%)]" />
                <div className="relative flex flex-col gap-5">
                  <div className="text-xs uppercase tracking-[0.4em] text-[color:var(--accent)]">
                    {volume.title}
                  </div>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-2xl font-semibold text-slate-950 font-[family:var(--font-display)]">
                      {volume.subtitle}
                    </h2>
                    <p className="text-sm leading-6 text-slate-600">
                      {volume.summary}
                    </p>
                  </div>
                </div>
                <div className="relative mt-6 flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-500">
                  <span>{volume.chapterRange}</span>
                  <span className="flex items-center gap-2">
                    Explore
                    <span className="text-[color:var(--accent)]">↗</span>
                  </span>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
