type LabStatus = "ok" | "warn" | "fail";

export function statusPill(status: LabStatus) {
  if (status === "fail") {
    return "rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700";
  }
  if (status === "warn") {
    return "rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800";
  }
  return "rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700";
}
