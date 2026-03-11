"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ShareBar({ label }: { label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState("");
  const resetRef = useRef<number | null>(null);
  const statusId = `${label.toLowerCase().replace(/\s+/g, "-")}-status`;
  const href = search ? `${pathname}?${search}` : pathname;

  useEffect(() => {
    return () => {
      if (resetRef.current) {
        window.clearTimeout(resetRef.current);
      }
    };
  }, []);

  const queueReset = () => {
    if (resetRef.current) {
      window.clearTimeout(resetRef.current);
    }

    resetRef.current = window.setTimeout(() => {
      setCopied(false);
      setStatus("");
    }, 1600);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${href}`);
      setCopied(true);
      setStatus("Link copied");
      queueReset();
    } catch {
      setCopied(false);
      setStatus("Copy unavailable");
      queueReset();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
        {label}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-describedby={statusId}
        className={`rounded-full border bg-white/80 px-4 py-2 text-[11px] font-medium uppercase tracking-[0.28em] shadow-sm transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] sm:text-xs ${
          copied
            ? "border-slate-900/20 text-slate-950"
            : "border-slate-900/10 text-slate-600 hover:-translate-y-0.5 hover:border-slate-900/30"
        }`}
      >
        Copy link
      </button>
      <div
        id={statusId}
        role="status"
        aria-live="polite"
        className="min-h-[1rem] text-[11px] uppercase tracking-[0.28em] text-slate-400 sm:text-xs"
      >
        {status || "\u00a0"}
      </div>
    </div>
  );
}
