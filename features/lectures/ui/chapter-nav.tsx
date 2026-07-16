import Link from "next/link";
import type { CSSProperties } from "react";
import type { Chapter, Volume } from "../data";

export function ChapterNav({
  volume,
  previous,
  current,
  next,
}: {
  volume: Volume;
  previous: Chapter | null;
  current: Chapter;
  next: Chapter | null;
}) {
  return (
    <section
      className="mx-auto grid max-w-6xl gap-3 px-6 pb-16 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-4"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <div className="grid gap-3 sm:flex sm:flex-wrap">
        {previous ? (
          <Link
            href={`/volume/${volume.id}/${previous.slug}`}
            className="w-full rounded-full border border-slate-900/10 px-5 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:w-auto sm:text-xs sm:whitespace-nowrap"
          >
            ← {previous.label}
          </Link>
        ) : null}
        <Link
          href={`/volume/${volume.id}`}
          className="w-full rounded-full border border-slate-900/10 px-5 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:w-auto sm:text-xs sm:whitespace-nowrap"
        >
          Volume index
        </Link>
        <Link
          href="/"
          className="w-full rounded-full border border-slate-900/10 px-5 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:w-auto sm:text-xs sm:whitespace-nowrap"
        >
          Back to home
        </Link>
      </div>
      {next ? (
        <Link
          href={`/volume/${volume.id}/transition/${current.slug}/${next.slug}`}
          className="w-full rounded-full border border-[color:var(--accent)] bg-white/80 px-6 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-[color:var(--accent)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:w-auto sm:text-xs sm:whitespace-nowrap"
        >
          Transition → {next.label}
        </Link>
      ) : null}
    </section>
  );
}
