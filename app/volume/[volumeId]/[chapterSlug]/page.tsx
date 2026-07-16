import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { volumes } from "@/features/lectures/data";
import { ChapterHero } from "@/features/lectures/ui/chapter-hero";
import { ChapterExplorer } from "@/features/lectures/ui/chapter-explorer";
import { ChapterInteractive } from "@/features/lectures/ui/chapter-interactive";
import { ChapterNav } from "@/features/lectures/ui/chapter-nav";
import { ChapterContentSection } from "@/features/lectures/ui/chapter-content";
import { ChapterLabList } from "@/features/labs/ui/chapter-lab-list";
import { ShareBar } from "@/features/lectures/ui/share-bar";
import {
  chapterSlugSchema,
  volumeIdSchema,
} from "@/features/lectures/schemas";
import { getChapterNeighbors } from "@/features/lectures/lib/lectures";
import { getChapterContent } from "@/features/lectures/content";
import { getChapterExperiments } from "@/features/lectures/interactive-map";
import { getChapterSections } from "@/features/labs/manifest";

export function generateStaticParams() {
  return volumes.flatMap((volume) =>
    volume.chapters.map((chapter) => ({
      volumeId: volume.id,
      chapterSlug: chapter.slug,
    }))
  );
}

export const dynamicParams = false;

type PageParams = { volumeId: string; chapterSlug: string };

export async function generateMetadata({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const volumeResult = volumeIdSchema.safeParse(resolvedParams);
  const chapterResult = chapterSlugSchema.safeParse(resolvedParams);

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
    alternates: {
      canonical: `/volume/${data.volume.id}/${data.current.slug}`,
    },
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
}: {
  params: PageParams | Promise<PageParams>;
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

  const content = getChapterContent(data.volume, data.current);
  const experiments = getChapterExperiments(data.volume, data.current);
  const sections = getChapterSections(data.volume.id, data.current.index);

  return (
    <main id="main-content" className="min-h-screen">
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
      <ChapterInteractive experiments={experiments} />
      <ChapterLabList sections={sections} />
      <ChapterExplorer
        accent={data.volume.accent}
        chapterSlug={data.current.slug}
        chapterTitle={data.current.title}
        panels={content.panels}
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
