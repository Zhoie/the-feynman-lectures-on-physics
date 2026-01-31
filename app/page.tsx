import { volumes } from "@/features/lectures/data";
import { HomeHero } from "@/features/lectures/ui/home-hero";
import { VolumeGrid } from "@/features/lectures/ui/volume-grid";

export default function HomePage() {
  const volumeOne = volumes[0];
  const primaryHref = volumeOne ? `/volume/${volumeOne.id}` : "/volume/volume-1";

  return (
    <main className="min-h-screen">
      <HomeHero primaryHref={primaryHref} />
      <VolumeGrid volumes={volumes} />
      <section className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-20">
        <div className="text-xs uppercase tracking-[0.4em] text-slate-500">
          Reading Path
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {volumes.map((volume) => (
            <div
              key={volume.id}
              className="rounded-2xl border border-slate-900/10 bg-white/70 p-5 text-sm text-slate-600"
            >
              <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                {volume.title}
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {volume.subtitle}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {volume.summary}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
