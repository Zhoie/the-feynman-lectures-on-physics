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
  "v1-ch12-s01-what-is-a-force": () =>
    import("@/labs/v1-ch12-s01-what-is-a-force/view"),
  "v1-ch12-s02-friction": () =>
    import("@/labs/v1-ch12-s02-friction/view"),
  "v1-ch12-s03-molecular-forces": () =>
    import("@/labs/v1-ch12-s03-molecular-forces/view"),
  "v1-ch12-s04-fundamental-forces-fields": () =>
    import("@/labs/v1-ch12-s04-fundamental-forces-fields/view"),
  "v1-ch12-s05-pseudo-forces": () =>
    import("@/labs/v1-ch12-s05-pseudo-forces/view"),
  "v1-ch12-s06-nuclear-forces": () =>
    import("@/labs/v1-ch12-s06-nuclear-forces/view"),
  "v2-ch12-s01-the-same-equations-have-the-same-solutions": () =>
    import("@/labs/v2-ch12-s01-the-same-equations-have-the-same-solutions/view"),
  "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary": () =>
    import("@/labs/v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary/view"),
  "v2-ch12-s03-the-stretched-membrane": () =>
    import("@/labs/v2-ch12-s03-the-stretched-membrane/view"),
  "v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium": () =>
    import("@/labs/v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium/view"),
  "v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere": () =>
    import("@/labs/v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere/view"),
  "v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane": () =>
    import("@/labs/v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane/view"),
  "v2-ch12-s07-the-underlying-unity-of-nature": () =>
    import("@/labs/v2-ch12-s07-the-underlying-unity-of-nature/view"),
  "v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles": () =>
    import("@/labs/v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles/view"),
  "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen": () =>
    import("@/labs/v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen/view"),
  "v3-ch12-s03-the-energy-levels": () =>
    import("@/labs/v3-ch12-s03-the-energy-levels/view"),
  "v3-ch12-s04-the-zeeman-splitting": () =>
    import("@/labs/v3-ch12-s04-the-zeeman-splitting/view"),
  "v3-ch12-s05-the-states-in-a-magnetic-field": () =>
    import("@/labs/v3-ch12-s05-the-states-in-a-magnetic-field/view"),
  "v3-ch12-s06-the-projection-matrix-for-spin-one6": () =>
    import("@/labs/v3-ch12-s06-the-projection-matrix-for-spin-one6/view"),
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
