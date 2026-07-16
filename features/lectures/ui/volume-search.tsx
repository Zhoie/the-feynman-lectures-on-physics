"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import {
  replaceSearchParams,
  useSearchParam,
} from "@/core/navigation/search-params";
import type { Chapter } from "../data";
import { ChapterGrid } from "./chapter-grid";
import { ShareBar } from "./share-bar";

export function VolumeBrowser({
  volumeId,
  chapters,
  accent,
}: {
  volumeId: string;
  chapters: Chapter[];
  accent: string;
}) {
  const initialQuery = useSearchParam("q") ?? "";
  return (
    <VolumeBrowserContent
      key={initialQuery}
      volumeId={volumeId}
      chapters={chapters}
      accent={accent}
      initialQuery={initialQuery}
    />
  );
}

function VolumeBrowserContent({
  volumeId,
  chapters,
  accent,
  initialQuery,
}: {
  volumeId: string;
  chapters: Chapter[];
  accent: string;
  initialQuery: string;
}) {
  const [query, setQuery] = useState(initialQuery);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleChapters = useMemo(
    () =>
      normalizedQuery
        ? chapters.filter((chapter) =>
            `${chapter.label} ${chapter.title}`
              .toLowerCase()
              .includes(normalizedQuery),
          )
        : chapters,
    [chapters, normalizedQuery],
  );
  const firstChapter = chapters[0];
  const inputId = "volume-chapter-search";
  const resultsId = `${inputId}-results`;
  const statusId = `${inputId}-status`;

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      replaceSearchParams((params) => {
        if (query) params.set("q", query);
        else params.delete("q");
      });
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [query]);

  return (
    <>
      <section
        className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-8"
        style={{ "--accent": accent } as CSSProperties}
      >
        <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className="rounded-full border border-slate-900/10 px-4 py-2">
                {chapters.length} Chapters
              </span>
              {firstChapter ? (
                <Link
                  href={`/volume/${volumeId}/${firstChapter.slug}`}
                  className="rounded-full border border-[color:var(--accent)] bg-white/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] text-[color:var(--accent)] transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-18px_rgba(15,23,42,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--accent)]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:text-xs"
                >
                  Start with {firstChapter.label}
                </Link>
              ) : null}
            </div>
            <ShareBar label="Share volume" />
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <label
              htmlFor={inputId}
              className="text-xs uppercase tracking-[0.3em] text-slate-400"
            >
              Find a chapter
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <input
                id={inputId}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title or chapter number"
                maxLength={60}
                aria-describedby={`${resultsId} ${statusId}`}
                className="w-full flex-1 rounded-full border border-slate-900/10 bg-white/90 px-5 py-3 text-sm text-slate-700 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-slate-400 focus-visible:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] md:min-w-[320px]"
              />
              <div
                id={resultsId}
                className="rounded-full border border-slate-900/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500"
              >
                Showing {visibleChapters.length} of {chapters.length}
              </div>
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Results update as you type
              </div>
              <div
                id={statusId}
                role="status"
                aria-live="polite"
                className="sr-only"
              >
                Showing {visibleChapters.length} of {chapters.length} chapters.
              </div>
            </div>
          </div>
        </div>
      </section>

      <ChapterGrid
        volumeId={volumeId}
        chapters={visibleChapters}
        accent={accent}
      />
      {visibleChapters.length === 0 ? (
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div
            role="status"
            aria-live="polite"
            className="rounded-2xl border border-dashed border-slate-900/20 bg-white/70 p-6 text-sm text-slate-500"
          >
            No chapters match “{query}”. Try a different phrase or remove the
            filter.
          </div>
        </section>
      ) : null}
    </>
  );
}
