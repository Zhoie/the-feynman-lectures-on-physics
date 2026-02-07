import type { ComponentType } from "react";

type LabLoader = () => Promise<{ default: ComponentType }>;

const registry: Record<string, LabLoader> = {
  "v1-ch01-s01-introduction": () =>
    import("@/labs/v1-ch01-s01-introduction/view"),
  "v1-ch01-s02-matter-is-made-of-atoms": () =>
    import("@/labs/v1-ch01-s02-matter-is-made-of-atoms/view"),
  "v1-ch01-s03-atomic-processes": () =>
    import("@/labs/v1-ch01-s03-atomic-processes/view"),
  "v1-ch01-s04-chemical-reactions": () =>
    import("@/labs/v1-ch01-s04-chemical-reactions/view"),
  "v1-ch10-s01-newton-s-third-law": () =>
    import("@/labs/v1-ch10-s01-newton-s-third-law/view"),
  "v1-ch10-s02-conservation-of-momentum": () =>
    import("@/labs/v1-ch10-s02-conservation-of-momentum/view"),
  "v1-ch10-s03-momentum-is-conserved": () =>
    import("@/labs/v1-ch10-s03-momentum-is-conserved/view"),
  "v1-ch10-s04-momentum-and-energy": () =>
    import("@/labs/v1-ch10-s04-momentum-and-energy/view"),
  "v1-ch10-s05-relativistic-momentum": () =>
    import("@/labs/v1-ch10-s05-relativistic-momentum/view"),
};

export const labIds = Object.keys(registry);

export function hasLab(labId: string) {
  return Object.prototype.hasOwnProperty.call(registry, labId);
}

export async function loadLabView(labId: string) {
  const loader = registry[labId];
  if (!loader) return null;
  const module = await loader();
  return module.default;
}
