"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import {
  registeredLabIds,
  type RegisteredLabId,
} from "../registered-lab-ids";
import { labViewLoaders } from "../registry";

function LoadingLab() {
  return (
    <section
      className="animate-pulse overflow-hidden rounded-2xl border border-slate-900/10 bg-white/80 sm:rounded-[2rem]"
      role="status"
      aria-label="Preparing laboratory"
    >
      <div className="border-b border-slate-900/10 px-5 py-6 sm:px-8">
        <div className="h-3 w-36 rounded-full bg-slate-300" />
        <div className="mt-6 h-10 max-w-lg rounded-xl bg-slate-200" />
        <div className="mt-4 h-4 max-w-2xl rounded-full bg-slate-200" />
      </div>
      <div className="grid gap-5 p-3 sm:p-6 xl:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.65fr)] xl:p-8">
        <div className="h-[300px] rounded-3xl bg-slate-100 sm:h-[420px]" />
        <div className="h-[300px] rounded-3xl bg-slate-100 sm:h-[420px]" />
      </div>
      <div className="border-t border-slate-900/10 px-5 py-6 sm:px-8">
        <div className="h-4 w-32 rounded-full bg-slate-200" />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
          <div className="h-24 rounded-2xl bg-slate-100" />
        </div>
      </div>
    </section>
  );
}

const labViews = Object.fromEntries(
  registeredLabIds.map((labId) => [
    labId,
    dynamic(labViewLoaders[labId], {
      loading: LoadingLab,
      ssr: false,
    }),
  ]),
) as Record<RegisteredLabId, ComponentType>;

type LabViewProps = {
  labId: RegisteredLabId;
};

export function LabView({ labId }: LabViewProps) {
  const View = labViews[labId];
  return <View />;
}
