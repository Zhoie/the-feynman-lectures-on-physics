export default function LabLoading() {
  return (
    <main
      id="main-content"
      className="mx-auto min-h-screen max-w-6xl px-6 py-16"
      aria-busy="true"
    >
      <span className="sr-only" role="status">
        Loading laboratory
      </span>
      <div className="animate-pulse">
        <div className="h-4 w-44 rounded-full bg-slate-300" />
        <div className="mt-8 h-12 max-w-3xl rounded-2xl bg-slate-200" />
        <div className="mt-5 h-5 max-w-xl rounded-full bg-slate-200" />
        <div className="mt-12 overflow-hidden rounded-3xl border border-slate-900/10 bg-white/75 p-5 sm:p-8">
          <div className="h-10 max-w-md rounded-xl bg-slate-200" />
          <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.65fr)]">
            <div className="h-[300px] rounded-3xl bg-slate-100 sm:h-[420px]" />
            <div className="h-[300px] rounded-3xl bg-slate-100 sm:h-[420px]" />
          </div>
        </div>
      </div>
    </main>
  );
}
