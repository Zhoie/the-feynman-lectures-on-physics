"use client";

import { RouteError } from "@/core/ui/route-error";

export default function LabError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <RouteError
      error={error}
      reset={reset}
      title="This laboratory stopped unexpectedly"
      description="Retry to recreate the model and return its controls to a safe state."
      scope="lab-route"
    />
  );
}
