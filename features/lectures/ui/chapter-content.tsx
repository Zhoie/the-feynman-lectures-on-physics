import type { CSSProperties } from "react";
import type { Chapter, Volume } from "../data";
import type { ChapterContent } from "../content";

export function ChapterContentSection({
  volume,
  chapter,
  content,
}: {
  volume: Volume;
  chapter: Chapter;
  content: ChapterContent;
}) {
  return (
    <section
      className="mx-auto grid max-w-6xl gap-6 px-6 pb-12 lg:grid-cols-[2fr_1fr]"
      style={{ "--accent": volume.accent } as CSSProperties}
    >
      <div className="rounded-3xl border border-slate-900/10 bg-white/85 p-8 shadow-sm backdrop-blur">
        <div className="text-xs uppercase tracking-[0.4em] text-slate-400">
          Field Notes
        </div>
        <h2 className="mt-3 text-2xl font-semibold text-slate-950 font-[family:var(--font-display)]">
          {chapter.title}
        </h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          {content.summary}
        </p>
        <div className="mt-6">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Key Ideas
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {content.keyIdeas.map((idea) => (
              <li key={idea} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[color:var(--accent)]" />
                <span>{idea}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Experiments
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {content.experiments.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Math Focus
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {content.mathFocus.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-900/10 bg-white/80 p-5 shadow-sm">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-400">
            Modern Echo
          </div>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {content.modernEcho.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
