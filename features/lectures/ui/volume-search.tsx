"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function VolumeSearch({
  initialQuery,
  resultsCount,
  totalCount,
}: {
  initialQuery: string;
  resultsCount: number;
  totalCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(initialQuery);
  const inputId = "volume-chapter-search";
  const resultsId = `${inputId}-results`;
  const statusId = `${inputId}-status`;

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const updateQuery = (value: string) => {
    setQuery(value);
    const params = new URLSearchParams(searchParams.toString());
    const normalized = value.trim();
    if (normalized) {
      params.set("q", normalized);
    } else {
      params.delete("q");
    }
    const next = params.toString();
    const href = next ? `${pathname}?${next}` : pathname;
    startTransition(() => {
      router.replace(href, { scroll: false });
    });
  };

  return (
    <div className="flex flex-col gap-3" aria-busy={isPending}>
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
          onChange={(event) => updateQuery(event.target.value)}
          placeholder="Search by title or chapter number"
          maxLength={60}
          aria-describedby={`${resultsId} ${statusId}`}
          className="w-full flex-1 rounded-full border border-slate-900/10 bg-white/90 px-5 py-3 text-sm text-slate-700 shadow-sm transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] placeholder:text-slate-400 focus-visible:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] md:min-w-[320px]"
        />
        <div
          id={resultsId}
          className="rounded-full border border-slate-900/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500"
        >
          Showing {resultsCount} of {totalCount}
        </div>
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Results update as you type
        </div>
        <div id={statusId} role="status" aria-live="polite" className="sr-only">
          {isPending
            ? "Updating chapter list."
            : `Showing ${resultsCount} of ${totalCount} chapters.`}
        </div>
      </div>
    </div>
  );
}
