import Link from "next/link";
import { volumes } from "@/features/lectures/data";
import { HomeHero } from "@/features/lectures/ui/home-hero";
import { VolumeGrid } from "@/features/lectures/ui/volume-grid";

export default function HomePage() {
  const volumeOne = volumes[0];
  const primaryHref = volumeOne ? `/volume/${volumeOne.id}` : "/volume/volume-1";
  const readingArc = [
    "Start with motion, scale, and physical intuition.",
    "Move into fields, matter, and distributed systems.",
    "Finish with amplitudes, spin, and quantum structure.",
  ];

  return (
    <main id="main-content" className="min-h-screen">
      <HomeHero primaryHref={primaryHref} />
      <VolumeGrid volumes={volumes} />
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-20">
        <div className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Suggested Arc
        </div>
        <ol className="grid gap-3">
          {volumes.map((volume, index) => (
            <li key={volume.id}>
              <Link
                href={`/volume/${volume.id}`}
                className="group grid gap-4 rounded-2xl border border-slate-900/10 bg-white/55 p-5 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-slate-900/20 hover:bg-white/80 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/15 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--paper)] md:grid-cols-[auto_1fr_auto] md:items-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-900/10 bg-white/75 text-[11px] font-medium uppercase tracking-[0.3em] text-slate-500">
                  {index + 1}
                </span>
                <div className="flex flex-col gap-2">
                  <div className="text-sm leading-6 text-slate-500">
                    {readingArc[index]}
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      {volume.title}
                    </div>
                    <div className="mt-2 text-lg font-semibold text-slate-950">
                      {volume.subtitle}
                    </div>
                  </div>
                  <p className="max-w-2xl text-sm leading-6 text-slate-600">
                    {volume.summary}
                  </p>
                </div>
                <div className="flex items-center justify-between gap-4 text-xs uppercase tracking-[0.28em] text-slate-500 md:flex-col md:items-end">
                  <span>{volume.chapterRange}</span>
                  <span className="flex items-center gap-2 font-semibold text-slate-900">
                    Open volume
                    <span className="transition duration-200 group-hover:translate-x-1 group-focus-visible:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
