"use client";

import Link from "next/link";
import { useEffect } from "react";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
  scope?: string;
};

export function RouteError({
  error,
  reset,
  title = "This page could not finish loading",
  description = "Retry the page. If the problem continues, return to the atlas.",
  scope = "route",
}: RouteErrorProps) {
  useEffect(() => {
    console.error(`[${scope}]`, error);
  }, [error, scope]);

  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center px-6 py-16"
    >
      <section
        className="w-full max-w-xl rounded-3xl border border-rose-900/15 bg-white/90 p-8 text-center shadow-sm"
        role="alert"
      >
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-800">
          Recovery mode
        </div>
        <h1 className="mt-4 font-[family:var(--font-display)] text-3xl font-semibold text-slate-950">
          {title}
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          {description}
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-slate-600">
            Reference {error.digest}
          </p>
        ) : null}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="min-h-11 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            Retry
          </button>
          <Link
            href="/"
            className="min-h-11 rounded-full border border-slate-900/15 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-slate-900/30 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
          >
            Return to atlas
          </Link>
        </div>
      </section>
    </main>
  );
}
