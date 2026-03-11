import Link from "next/link";
import type { Volume } from "../data";

export function VolumeNav({
  previous,
  next,
}: {
  previous: Volume | null;
  next: Volume | null;
}) {
  return (
    <section className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-16">
      <div className="flex flex-wrap gap-3">
        {previous ? (
          <Link
            href={`/volume/${previous.id}`}
            className="rounded-full border border-slate-900/10 px-5 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:text-xs sm:whitespace-nowrap"
          >
            ← {previous.title}
          </Link>
        ) : null}
        <Link
          href="/"
          className="rounded-full border border-slate-900/10 px-5 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:text-xs sm:whitespace-nowrap"
        >
          Back to home
        </Link>
      </div>
      {next ? (
        <Link
          href={`/volume/${next.id}`}
          className="rounded-full border border-slate-900/10 bg-white/80 px-5 py-3 text-center text-[11px] uppercase tracking-[0.28em] text-slate-500 shadow-sm transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-slate-900/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:text-xs sm:whitespace-nowrap"
        >
          {next.title} →
        </Link>
      ) : null}
    </section>
  );
}
