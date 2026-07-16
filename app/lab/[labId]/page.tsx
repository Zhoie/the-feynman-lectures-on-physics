import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getSectionByLabId } from "@/features/labs/manifest";
import {
  isRegisteredLabId,
  registeredLabIds,
} from "@/features/labs/registered-lab-ids";
import { LabView } from "@/features/labs/ui/lab-view";

type PageParams = { labId: string };

export const dynamicParams = false;

export function generateStaticParams(): PageParams[] {
  return registeredLabIds.map((labId) => ({ labId }));
}

export async function generateMetadata({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  if (!isRegisteredLabId(resolvedParams.labId)) return {};
  const section = getSectionByLabId(resolvedParams.labId);
  if (!section) return {};
  const title = `${section.sectionNumber} ${section.sectionTitle} · ${section.chapterTitle}`;
  const description = `Interactive lab for ${section.sectionNumber} ${section.sectionTitle}.`;
  const canonical = `/lab/${resolvedParams.labId}`;
  const ogUrl = `/og?title=${encodeURIComponent(
    section.sectionTitle,
  )}&subtitle=${encodeURIComponent(
    section.chapterTitle,
  )}&meta=${encodeURIComponent(`Section ${section.sectionNumber}`)}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
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

export default async function LabPage({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}) {
  const resolvedParams = await params;
  if (!isRegisteredLabId(resolvedParams.labId)) notFound();
  const section = getSectionByLabId(resolvedParams.labId);
  if (!section) notFound();

  return (
    <main id="main-content" className="min-h-screen">
      <section className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-10 pt-12 sm:pt-16">
        <Link
          href={`/volume/${section.volumeId}/${section.chapterSlug}`}
          prefetch={false}
          className="w-fit text-sm font-medium text-slate-500 transition hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          ← Back to {section.chapterTitle}
        </Link>
        <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
          {section.volumeId.replace("-", " ")} · Chapter {section.chapterIndex} ·{" "}
          Section {section.sectionNumber}
        </div>
        <h1 className="max-w-4xl font-[family:var(--font-display)] text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
          {section.sectionTitle}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-slate-600">
          Explore the model, change one variable at a time, and compare the
          live result with its declared reference.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <LabView labId={resolvedParams.labId} />
      </section>
    </main>
  );
}
