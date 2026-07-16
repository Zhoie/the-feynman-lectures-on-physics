import Link from "next/link";
import type { CSSProperties } from "react";
import type { Volume } from "../data";

export function VolumeGrid({ volumes }: { volumes: Volume[] }) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-20">
      <div className="grid gap-6 md:grid-cols-3">
        {volumes.map((volume) => (
          <div key={volume.id}>
            <Link
              href={`/volume/${volume.id}`}
              className="group block h-full focus-visible:outline-none"
            >
              <div
                className="relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-slate-900/10 bg-white/80 p-6 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-slate-900/20 group-hover:shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)] group-focus-visible:ring-2 group-focus-visible:ring-[color:var(--accent)]/35 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--paper)]"
                style={{ "--accent": volume.accent } as CSSProperties}
              >
                <div className="absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 [background-image:radial-gradient(circle_at_20%_20%,color-mix(in_srgb,var(--accent)_25%,transparent),transparent_60%)]" />
                <div className="relative flex flex-col gap-5">
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)]">
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
                <div className="relative mt-6 flex items-center justify-between text-sm font-medium text-slate-500">
                  <span>{volume.chapterRange}</span>
                  <span className="flex items-center gap-2">
                    Explore
                    <span className="text-[color:var(--accent)]">↗</span>
                  </span>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
