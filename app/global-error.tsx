"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global]", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-[#f6f2e9] px-6 py-16 text-[#17201d]">
          <section
            className="w-full max-w-xl rounded-3xl border border-slate-900/15 bg-white p-8 text-center"
            role="alert"
          >
            <h1 className="font-serif text-3xl font-semibold">
              The atlas could not start
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Retry the application to restore the current page.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-7 min-h-11 rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white"
            >
              Retry application
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
