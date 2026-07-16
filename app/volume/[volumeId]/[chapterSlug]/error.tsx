"use client";

import { RouteError } from "@/core/ui/route-error";

export default function ChapterError({
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
      title="This chapter could not finish loading"
      description="Retry the chapter. Your selected experiment remains encoded in the URL."
      scope="chapter-route"
    />
  );
}
