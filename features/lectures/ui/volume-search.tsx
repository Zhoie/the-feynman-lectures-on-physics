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
    <div className="flex flex-col gap-3">
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
          className="w-full flex-1 rounded-full border border-slate-900/10 bg-white/90 px-5 py-3 text-sm text-slate-700 shadow-sm outline-none transition focus:border-slate-900/30 md:min-w-[320px]"
        />
        <div className="rounded-full border border-slate-900/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-500">
          {resultsCount} of {totalCount}
        </div>
        {isPending ? (
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Updating
          </div>
        ) : null}
      </div>
    </div>
  );
}
