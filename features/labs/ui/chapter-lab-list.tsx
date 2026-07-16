import type { LabSection } from "../manifest";
import { isRegisteredLabId } from "../registered-lab-ids";
import { LabLink } from "./lab-link";

type ChapterLabListProps = {
  sections: LabSection[];
};

export function ChapterLabList({ sections }: ChapterLabListProps) {
  return (
    <section className="mx-auto flex max-w-6xl flex-col gap-5 px-6 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
            Quantitative section labs
          </div>
          <h2 className="mt-2 font-[family:var(--font-display)] text-3xl font-semibold text-slate-950">
            Chapter Experiments
          </h2>
        </div>
      </div>
      <div className="grid gap-4">
        {sections.map((section) => {
          return (
            <div
              key={section.labId}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl border border-slate-900/10 bg-white/80 p-4"
            >
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                  {section.sectionNumber}
                </div>
                <div className="mt-2 font-[family:var(--font-display)] text-xl font-semibold text-slate-950">
                  {section.sectionTitle}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  {section.archetype ?? "lab"}
                </div>
              </div>
              {isRegisteredLabId(section.labId) ? (
                <LabLink
                  labId={section.labId}
                  className="min-h-11 rounded-full border border-slate-900/15 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:border-slate-900/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                >
                  Open lab
                </LabLink>
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
