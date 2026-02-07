import Link from "next/link";
import type { LabSection } from "../manifest";
import { hasLab } from "../registry";

type ChapterLabListProps = {
  sections: LabSection[];
};

export function ChapterLabList({ sections }: ChapterLabListProps) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Section Labs
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Chapter Experiments
          </h2>
        </div>
      </div>
      <div className="grid gap-4">
        {sections.map((section) => {
          const available = hasLab(section.labId);
          return (
            <div
              key={section.labId}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-900/10 bg-white/80 p-4 shadow-sm"
            >
              <div>
                <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  {section.sectionNumber}
                </div>
                <div className="mt-1 text-lg font-semibold text-slate-900">
                  {section.sectionTitle}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {section.archetype ?? "lab"}
                </div>
              </div>
              {available ? (
                <Link
                  href={`/lab/${section.labId}`}
                  className="rounded-full border border-slate-900/10 px-4 py-2 text-xs font-semibold text-slate-700 hover:border-slate-900/30"
                >
                  Open Lab
                </Link>
              ) : (
                <span className="rounded-full border border-slate-900/10 px-4 py-2 text-xs text-slate-400">
                  Planned
                </span>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
