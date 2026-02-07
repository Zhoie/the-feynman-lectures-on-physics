import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSectionByLabId } from "@/features/labs/manifest";
import { loadLabView } from "@/features/labs/registry";

type PageParams = { labId: string };

export async function generateMetadata({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const section = getSectionByLabId(resolvedParams.labId);
  if (!section) return {};
  return {
    title: `${section.sectionNumber} ${section.sectionTitle} · ${section.chapterTitle}`,
    description: `Interactive lab for ${section.sectionNumber} ${section.sectionTitle}.`,
  };
}

export default async function LabPage({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const section = getSectionByLabId(resolvedParams.labId);
  if (!section) notFound();
  const View = await loadLabView(section.labId);
  if (!View) notFound();

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex max-w-6xl flex-col gap-4 px-6 pb-12 pt-16">
        <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
          {section.volumeId.replace("-", " ")} · Ch. {section.chapterIndex} ·{" "}
          {section.sectionNumber}
        </div>
        <h1 className="text-3xl font-semibold text-slate-900">
          {section.sectionTitle}
        </h1>
        <p className="text-sm text-slate-600">
          {section.chapterTitle}
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <View />
      </section>
    </main>
  );
}
