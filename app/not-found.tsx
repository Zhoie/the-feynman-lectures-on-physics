import Link from "next/link";

export default function NotFound() {
  return (
    <main
      id="main-content"
      className="grid min-h-screen place-items-center px-6 py-16"
    >
      <section className="w-full max-w-xl rounded-3xl border border-slate-900/10 bg-white/90 p-8 text-center">
        <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-600">
          Page not found
        </div>
        <h1 className="mt-4 font-[family:var(--font-display)] text-4xl font-semibold text-slate-950">
          This path is outside the atlas
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">
          The volume, chapter, transition, or laboratory may have moved.
        </p>
        <Link
          href="/"
          className="mt-7 inline-flex min-h-11 items-center rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2"
        >
          Return to atlas
        </Link>
      </section>
    </main>
  );
}
