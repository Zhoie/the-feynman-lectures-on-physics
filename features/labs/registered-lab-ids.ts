export const registeredLabIds = [
  "v1-ch01-s01-introduction",
  "v1-ch01-s02-matter-is-made-of-atoms",
  "v1-ch01-s03-atomic-processes",
  "v1-ch01-s04-chemical-reactions",
  "v1-ch10-s01-newton-s-third-law",
  "v1-ch10-s02-conservation-of-momentum",
  "v1-ch10-s03-momentum-is-conserved",
  "v1-ch10-s04-momentum-and-energy",
  "v1-ch10-s05-relativistic-momentum",
  "v1-ch12-s01-what-is-a-force",
  "v1-ch12-s02-friction",
  "v1-ch12-s03-molecular-forces",
  "v1-ch12-s04-fundamental-forces-fields",
  "v1-ch12-s05-pseudo-forces",
  "v1-ch12-s06-nuclear-forces",
  "v2-ch12-s01-the-same-equations-have-the-same-solutions",
  "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary",
  "v2-ch12-s03-the-stretched-membrane",
  "v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium",
  "v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere",
  "v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane",
  "v2-ch12-s07-the-underlying-unity-of-nature",
  "v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles",
  "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen",
  "v3-ch12-s03-the-energy-levels",
  "v3-ch12-s04-the-zeeman-splitting",
  "v3-ch12-s05-the-states-in-a-magnetic-field",
  "v3-ch12-s06-the-projection-matrix-for-spin-one6",
] as const;

export type RegisteredLabId = (typeof registeredLabIds)[number];

const registeredLabIdSet: ReadonlySet<string> = new Set(registeredLabIds);

export function isRegisteredLabId(labId: string): labId is RegisteredLabId {
  return registeredLabIdSet.has(labId);
}
