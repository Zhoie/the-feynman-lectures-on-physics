export default function ChapterLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto min-h-screen max-w-6xl px-6 py-16"
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading chapter
      </span>
      <div className="animate-pulse">
        <div className="h-4 w-40 rounded-full bg-slate-300" />
        <div className="mt-8 h-14 max-w-4xl rounded-2xl bg-slate-200" />
        <div className="mt-5 h-5 max-w-2xl rounded-full bg-slate-200" />
        <div className="mt-12 h-44 rounded-3xl border border-slate-900/10 bg-white/70" />
        <div className="mt-10 grid gap-5 lg:grid-cols-[1.6fr_1fr]">
          <div className="h-[260px] rounded-3xl bg-slate-100 sm:h-[320px]" />
          <div className="h-[260px] rounded-3xl bg-slate-100 sm:h-[320px]" />
        </div>
      </div>
    </main>
  );
}
