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
      className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-16"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <div className="flex flex-wrap gap-3">
        {previous ? (
          <Link
            href={`/volume/${volume.id}/${previous.slug}`}
            className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30"
          >
            ← {previous.label}
          </Link>
        ) : null}
        <Link
          href={`/volume/${volume.id}`}
          className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30"
        >
          Volume index
        </Link>
        <Link
          href="/"
          className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30"
        >
          Back to home
        </Link>
      </div>
      {next ? (
        <Link
          href={`/volume/${volume.id}/transition/${current.slug}/${next.slug}`}
          className="rounded-full border border-[color:var(--accent)] bg-white/80 px-6 py-3 text-xs uppercase tracking-[0.3em] text-[color:var(--accent)] shadow-sm transition hover:-translate-y-0.5"
        >
          Transition → {next.label}
        </Link>
      ) : null}
    </section>
  );
}
