import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import type { CSSProperties } from "react";
import { volumes } from "@/features/lectures/data";
import { ChapterGrid } from "@/features/lectures/ui/chapter-grid";
import { VolumeHero } from "@/features/lectures/ui/volume-hero";
import { VolumeNav } from "@/features/lectures/ui/volume-nav";
import { VolumeSearch } from "@/features/lectures/ui/volume-search";
import { ShareBar } from "@/features/lectures/ui/share-bar";
import { volumeIdSchema, volumeSearchParamsSchema } from "@/features/lectures/schemas";
import { getVolumeById, getVolumeNavigation } from "@/features/lectures/lib/lectures";

export function generateStaticParams() {
  return volumes.map((volume) => ({ volumeId: volume.id }));
}

type PageParams = { volumeId: string };

type PageSearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const parsed = volumeIdSchema.safeParse(params);
  if (!parsed.success) {
    return {};
  }

  const volume = getVolumeById(parsed.data.volumeId);
  if (!volume) {
    return {};
  }

  const title = `${volume.title} · ${volume.subtitle}`;
  const description = volume.summary;
  const ogTitle = encodeURIComponent(volume.subtitle);
  const ogMeta = encodeURIComponent(volume.title);
  const ogUrl = `/og?title=${ogTitle}&subtitle=${encodeURIComponent(
    "Volume Overview"
  )}&meta=${ogMeta}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/volume/${volume.id}`,
      images: [{ url: ogUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function VolumePage({
  params,
  searchParams,
}: {
  params: PageParams | Promise<PageParams>;
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
}) {
  const resolvedParams = await params;
  const parsed = volumeIdSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    notFound();
  }

  const volume = getVolumeById(parsed.data.volumeId);
  if (!volume) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const searchResult = volumeSearchParamsSchema.safeParse(
    resolvedSearchParams ?? {}
  );
  const query = searchResult.success && searchResult.data.q
    ? searchResult.data.q
    : "";
  const normalizedQuery = query.toLowerCase();
  const chapters = normalizedQuery
    ? volume.chapters.filter((chapter) =>
        `${chapter.label} ${chapter.title}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : volume.chapters;
  const navigation = getVolumeNavigation(volume.id);
  const firstChapter = volume.chapters[0];

  return (
    <main className="min-h-screen">
      <VolumeHero volume={volume} />
      <section
        className="mx-auto flex max-w-6xl flex-col gap-6 px-6 pb-8"
        style={{ "--accent": volume.accent } as CSSProperties}
      >
        <div className="rounded-3xl border border-slate-900/10 bg-white/80 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.3em] text-slate-500">
              <span className="rounded-full border border-slate-900/10 px-4 py-2">
                {volume.chapters.length} Chapters
              </span>
              {firstChapter ? (
                <Link
                  href={`/volume/${volume.id}/${firstChapter.slug}`}
                  className="rounded-full border border-[color:var(--accent)] bg-white/80 px-4 py-2 text-[color:var(--accent)] shadow-sm transition hover:-translate-y-0.5"
                >
                  Start with {firstChapter.label}
                </Link>
              ) : null}
            </div>
            <ShareBar label="Share volume" />
          </div>
          <div className="mt-6">
            <VolumeSearch
              initialQuery={query}
              resultsCount={chapters.length}
              totalCount={volume.chapters.length}
            />
          </div>
        </div>
      </section>
      <ChapterGrid
        volumeId={volume.id}
        chapters={chapters}
        accent={volume.accent}
      />
      {chapters.length === 0 ? (
        <section className="mx-auto max-w-6xl px-6 pb-12">
          <div className="rounded-2xl border border-dashed border-slate-900/20 bg-white/70 p-6 text-sm text-slate-500">
            No chapters match "{query}". Try a different phrase or remove the
            filter.
          </div>
        </section>
      ) : null}
      <VolumeNav
        previous={navigation?.previous ?? null}
        next={navigation?.next ?? null}
      />
    </main>
  );
}
