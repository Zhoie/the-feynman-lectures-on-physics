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
            className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30"
          >
            ← {previous.title}
          </Link>
        ) : null}
        <Link
          href="/"
          className="rounded-full border border-slate-900/10 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 transition hover:border-slate-900/30"
        >
          Back to home
        </Link>
      </div>
      {next ? (
        <Link
          href={`/volume/${next.id}`}
          className="rounded-full border border-slate-900/10 bg-white/80 px-5 py-3 text-xs uppercase tracking-[0.3em] text-slate-500 shadow-sm transition hover:-translate-y-0.5"
        >
          {next.title} →
        </Link>
      ) : null}
    </section>
  );
}
