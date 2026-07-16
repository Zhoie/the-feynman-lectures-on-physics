import Link from "next/link";
import type { CSSProperties } from "react";
import type { Chapter } from "../data";

export function ChapterGrid({
  volumeId,
  chapters,
  accent,
}: {
  volumeId: string;
  chapters: Chapter[];
  accent: string;
}) {
  return (
    <section className="mx-auto max-w-6xl px-6 pb-24">
      <ul
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        style={{ "--accent": accent } as CSSProperties}
      >
        {chapters.map((chapter) => (
          <li key={chapter.slug}>
            <Link
              href={`/volume/${volumeId}/${chapter.slug}`}
              prefetch={false}
              className="group block h-full focus-visible:outline-none"
            >
              <div className="relative flex h-full flex-col gap-3 rounded-xl border border-slate-900/10 bg-white/75 p-4 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-slate-900/20 group-hover:shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)] group-focus-visible:ring-2 group-focus-visible:ring-[color:var(--accent)]/30 group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-[var(--paper)]">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {chapter.label}
                </div>
                <div className="text-lg font-semibold text-slate-900">
                  {chapter.title}
                </div>
                <div className="text-sm font-medium text-[color:var(--accent)]">
                  Enter
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
