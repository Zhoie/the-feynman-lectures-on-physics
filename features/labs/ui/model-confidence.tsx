import type { SimulationConfig } from "@/core/simulation/fixed-step";
import type { ModelMeta, ValidationResult } from "../types";
import { statusPill } from "./lab-status";
import type { LabRuntimeStats } from "./use-lab-runtime";

export function ModelConfidence({
  meta,
  runtime,
  simulation,
  validation,
}: {
  meta: ModelMeta;
  runtime: LabRuntimeStats;
  simulation: SimulationConfig;
  validation: ValidationResult | null;
}) {
  const status = validation?.status ?? "warn";
  const label = validation?.status ?? "checking";

  return (
    <details className="group border-t border-slate-900/10 bg-slate-50/70">
      <summary className="cursor-pointer list-none px-5 py-5 marker:hidden sm:px-8">
        <span className="flex flex-wrap items-center justify-between gap-3">
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Model confidence and sources
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              {meta.fidelity === "quantitative"
                ? "Quantitative model with declared validation bounds"
                : "Qualitative teaching model"}
            </span>
          </span>
          <span className="flex items-center gap-3">
            <span className={statusPill(status)}>{label}</span>
            <span aria-hidden="true" className="text-slate-400">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">−</span>
            </span>
          </span>
        </span>
      </summary>

      <div className="grid gap-6 border-t border-slate-900/10 px-5 py-6 text-sm leading-6 text-slate-600 sm:px-8 lg:grid-cols-2">
        <div className="grid gap-6">
          <section>
            <h3 className="font-semibold text-slate-800">Assumptions</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {meta.assumptions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          <section>
            <h3 className="font-semibold text-slate-800">Valid range</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {meta.validRange.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {meta.notes ? <p className="text-slate-500">{meta.notes}</p> : null}
        </div>

        <div className="grid gap-6">
          {validation?.checks.length ? (
            <section>
              <h3 className="font-semibold text-slate-800">
                Validation checks
              </h3>
              <div className="mt-3 grid gap-2">
                {validation.checks.map((check) => (
                  <div
                    key={check.id}
                    className="rounded-xl border border-slate-900/10 bg-white p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span>{check.label}</span>
                      <span className={statusPill(check.status)}>
                        {check.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Value {check.value}
                      {check.reference !== undefined
                        ? ` · reference ${check.reference}`
                        : ""}
                      {check.tolerance !== undefined
                        ? ` · tolerance ${check.tolerance}`
                        : ""}
                    </div>
                    {check.message ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {check.message}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {validation?.warnings?.length ? (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-800">
              {validation.warnings.join(" ")}
            </div>
          ) : null}

          {meta.sources.length ? (
            <section>
              <h3 className="font-semibold text-slate-800">Sources</h3>
              <ul className="mt-2 space-y-2">
                {meta.sources.map((source) => (
                  <li key={`${source.kind}-${source.url}`}>
                    <a
                      href={source.url}
                      className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-4 hover:text-sky-900"
                      target="_blank"
                      rel="noreferrer"
                    >
                      {source.label}
                    </a>{" "}
                    <span className="text-slate-500">
                      ({source.kind}
                      {source.status ? ` · ${source.status}` : ""})
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <div className="grid gap-1 text-xs text-slate-600">
            <span>
              Fixed update {simulation.fixedDt.toFixed(4)} seconds · maximum{" "}
              {simulation.maxSubSteps} updates per frame
            </span>
            <span>
              Frames {runtime.frames} · slow frames {runtime.slowFrames} · peak{" "}
              {(runtime.maximumFrameDelta * 1000).toFixed(1)} ms · dropped{" "}
              {(runtime.droppedSimulationTime * 1000).toFixed(1)} ms
            </span>
          </div>
        </div>
      </div>
    </details>
  );
}
