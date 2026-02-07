import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { volumes } from "@/features/lectures/data";
import { ChapterHero } from "@/features/lectures/ui/chapter-hero";
import { ChapterExplorer } from "@/features/lectures/ui/chapter-explorer";
import { ChapterNav } from "@/features/lectures/ui/chapter-nav";
import { ChapterContentSection } from "@/features/lectures/ui/chapter-content";
import { ChapterLabList } from "@/features/labs/ui/chapter-lab-list";
import { ShareBar } from "@/features/lectures/ui/share-bar";
import {
  chapterSlugSchema,
  chapterSearchParamsSchema,
  volumeIdSchema,
} from "@/features/lectures/schemas";
import { getChapterNeighbors } from "@/features/lectures/lib/lectures";
import { getChapterContent } from "@/features/lectures/content";
import { getChapterSections } from "@/features/labs/manifest";

export function generateStaticParams() {
  return volumes.flatMap((volume) =>
    volume.chapters.map((chapter) => ({
      volumeId: volume.id,
      chapterSlug: chapter.slug,
    }))
  );
}

type PageParams = { volumeId: string; chapterSlug: string };

type PageSearchParams = { [key: string]: string | string[] | undefined };

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const volumeResult = volumeIdSchema.safeParse(params);
  const chapterResult = chapterSlugSchema.safeParse(params);

  if (!volumeResult.success || !chapterResult.success) {
    return {};
  }

  const data = getChapterNeighbors(
    volumeResult.data.volumeId,
    chapterResult.data.chapterSlug
  );

  if (!data) {
    return {};
  }

  const content = getChapterContent(data.volume, data.current);
  const title = `${data.current.title} · ${data.volume.title}`;
  const description = content.summary;
  const ogUrl = `/og?title=${encodeURIComponent(
    data.current.title
  )}&subtitle=${encodeURIComponent(
    data.volume.subtitle
  )}&meta=${encodeURIComponent(data.current.label)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/volume/${data.volume.id}/${data.current.slug}`,
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

export default async function ChapterPage({
  params,
  searchParams,
}: {
  params: PageParams | Promise<PageParams>;
  searchParams?: PageSearchParams | Promise<PageSearchParams>;
}) {
  const resolvedParams = await params;
  const volumeResult = volumeIdSchema.safeParse(resolvedParams);
  const chapterResult = chapterSlugSchema.safeParse(resolvedParams);

  if (!volumeResult.success || !chapterResult.success) {
    notFound();
  }

  const data = getChapterNeighbors(
    volumeResult.data.volumeId,
    chapterResult.data.chapterSlug
  );

  if (!data) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const searchResult = chapterSearchParamsSchema.safeParse(
    resolvedSearchParams ?? {}
  );
  const activePanel =
    searchResult.success && searchResult.data.panel
      ? searchResult.data.panel
      : "intuition";
  const content = getChapterContent(data.volume, data.current);
  const sections = getChapterSections(data.volume.id, data.current.index);

  return (
    <main className="min-h-screen">
      <ChapterHero volume={data.volume} chapter={data.current} />
      <section className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pb-8">
        <ShareBar label="Share chapter" />
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {data.volume.title} · {data.current.label}
        </div>
      </section>
      <ChapterContentSection
        volume={data.volume}
        chapter={data.current}
        content={content}
      />
      <ChapterLabList sections={sections} />
      <ChapterExplorer
        volume={data.volume}
        chapter={data.current}
        panels={content.panels}
        activePanel={activePanel}
      />
      <ChapterNav
        volume={data.volume}
        previous={data.previous}
        current={data.current}
        next={data.next}
      />
    </main>
  );
}
