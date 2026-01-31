"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ShareBar({ label }: { label: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const paramsString = searchParams.toString();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const origin = window.location.origin;
    setUrl(`${origin}${pathname}${paramsString ? `?${paramsString}` : ""}`);
  }, [pathname, paramsString]);

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Ignore clipboard errors.
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
        className="rounded-full border border-slate-900/10 bg-white/80 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-600 transition hover:border-slate-900/30"
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
