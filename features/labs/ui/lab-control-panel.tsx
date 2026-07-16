import {
  controlPrecision,
  normalizeLabControlValue,
} from "../lib/presentation";
import type { ControlSpec } from "../types";

type LabControlPanelProps = {
  controls: { basic: ControlSpec[]; advanced: ControlSpec[] };
  defaultParams: Record<string, number>;
  params: Record<string, number>;
  onChange: (control: ControlSpec, value: number) => void;
  onReset: () => void;
};

function controlLabel(control: ControlSpec, value: number) {
  if (control.type === "select") {
    return (
      control.options?.find((option) => option.value === value)?.label ??
      `${value}`
    );
  }
  return `${value.toFixed(controlPrecision(control.step))}${
    control.unit ? ` ${control.unit}` : ""
  }`;
}

function LabControl({
  control,
  defaultValue,
  params,
  onChange,
}: {
  control: ControlSpec;
  defaultValue: number;
  params: Record<string, number>;
  onChange: (control: ControlSpec, value: number) => void;
}) {
  if (control.visibleWhen && !control.visibleWhen(params)) return null;

  const value = normalizeLabControlValue(
    control,
    params[control.id],
    defaultValue,
  );
  const label = controlLabel(control, value);

  return (
    <label className="grid gap-2 text-sm text-slate-700">
      <span className="flex items-center justify-between gap-4">
        <span className="font-medium">{control.label}</span>
        <span className="tabular-nums text-slate-500">{label}</span>
      </span>
      {control.type === "select" && control.options ? (
        <select
          value={value}
          onChange={(event) => onChange(control, Number(event.target.value))}
          className="min-h-11 rounded-xl border border-slate-900/15 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus-visible:border-sky-600 focus-visible:ring-2 focus-visible:ring-sky-200"
        >
          {control.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step}
          value={value}
          aria-valuetext={label}
          onChange={(event) => onChange(control, Number(event.target.value))}
          className="experiment-range w-full"
        />
      )}
    </label>
  );
}

function ControlList({
  controls,
  defaultParams,
  params,
  onChange,
}: Omit<LabControlPanelProps, "controls" | "onReset"> & {
  controls: ControlSpec[];
}) {
  return (
    <div className="grid gap-5">
      {controls.map((control) => (
        <LabControl
          key={control.id}
          control={control}
          defaultValue={defaultParams[control.id] ?? control.default}
          params={params}
          onChange={onChange}
        />
      ))}
    </div>
  );
}

export function LabControlPanel({
  controls,
  defaultParams,
  params,
  onChange,
  onReset,
}: LabControlPanelProps) {
  return (
    <aside
      className="flex flex-col gap-5 rounded-3xl border border-slate-900/10 bg-white p-5"
      aria-label="Experiment controls"
    >
      <div className="flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold text-slate-800">Controls</h3>
        <button
          type="button"
          onClick={onReset}
          className="min-h-11 rounded-full border border-slate-900/15 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-900/30 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
        >
          Reset defaults
        </button>
      </div>
      <ControlList
        controls={controls.basic}
        defaultParams={defaultParams}
        params={params}
        onChange={onChange}
      />
      {controls.advanced.length ? (
        <details className="group rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4">
          <summary className="cursor-pointer list-none text-sm font-semibold text-slate-700 marker:hidden">
            <span className="flex items-center justify-between">
              Advanced controls
              <span aria-hidden="true" className="text-slate-400">
                <span className="group-open:hidden">+</span>
                <span className="hidden group-open:inline">−</span>
              </span>
            </span>
          </summary>
          <div className="mt-5">
            <ControlList
              controls={controls.advanced}
              defaultParams={defaultParams}
              params={params}
              onChange={onChange}
            />
          </div>
        </details>
      ) : null}
    </aside>
  );
}
