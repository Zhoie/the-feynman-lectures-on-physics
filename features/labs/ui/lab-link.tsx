"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import type { RegisteredLabId } from "../registered-lab-ids";
import { preloadLabView } from "../registry";

export function LabLink({
  labId,
  children,
  className,
}: {
  labId: RegisteredLabId;
  children: ReactNode;
  className: string;
}) {
  const router = useRouter();
  const href = `/lab/${labId}`;
  const preload = () => {
    router.prefetch(href);
    void preloadLabView(labId);
  };

  return (
    <Link
      href={href}
      prefetch={false}
      onPointerEnter={preload}
      onFocus={preload}
      className={className}
    >
      {children}
    </Link>
  );
}
