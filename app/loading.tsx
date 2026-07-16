export default function Loading() {
  return (
    <main
      id="main-content"
      className="mx-auto min-h-screen max-w-6xl px-6 py-16"
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading page
      </span>
      <div className="animate-pulse rounded-3xl border border-slate-900/10 bg-white/70 p-8">
        <div className="h-3 w-32 rounded-full bg-slate-300" />
        <div className="mt-6 h-12 max-w-3xl rounded-2xl bg-slate-200" />
        <div className="mt-4 h-5 max-w-xl rounded-full bg-slate-200" />
        <div className="mt-10 h-72 rounded-3xl bg-slate-100" />
      </div>
    </main>
  );
}
