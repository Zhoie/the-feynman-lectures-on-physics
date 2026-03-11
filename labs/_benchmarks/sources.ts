import type { ModelSource } from "@/features/labs/types";

type SourceMap = Record<string, ModelSource[]>;

export const benchmarkSources: SourceMap = {
  "v1-ch10-s01-newton-s-third-law": [
    {
      label: "Feynman Lectures Vol. I Ch.10 (Newton's Third Law)",
      url: "https://www.feynmanlectures.caltech.edu/I_10.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "CH10 force sensor profile (N vs time)",
      url: "/labs/_benchmarks/ch10/s01-force-sensor.json",
      kind: "dataset",
      status: "ready",
    },
  ],
  "v1-ch10-s02-conservation-of-momentum": [
    {
      label: "1D collision momentum equations",
      url: "https://en.wikipedia.org/wiki/Elastic_collision#One-dimensional_Newtonian",
      kind: "formula",
      status: "ready",
    },
    {
      label: "CH10 collision-track profile (normalized momentum drift)",
      url: "/labs/_benchmarks/ch10/s02-collision-track.json",
      kind: "dataset",
      status: "ready",
    },
  ],
  "v1-ch10-s03-momentum-is-conserved": [
    {
      label: "Center-of-mass and recoil conservation equations",
      url: "https://en.wikipedia.org/wiki/Conservation_of_momentum",
      kind: "formula",
      status: "ready",
    },
    {
      label: "CH10 recoil profile (center-of-mass drift in m)",
      url: "/labs/_benchmarks/ch10/s03-recoil.json",
      kind: "dataset",
      status: "ready",
    },
  ],
  "v1-ch10-s04-momentum-and-energy": [
    {
      label: "Coefficient of restitution and kinetic energy ratio",
      url: "https://en.wikipedia.org/wiki/Coefficient_of_restitution",
      kind: "formula",
      status: "ready",
    },
    {
      label: "CH10 energy-loss profile (Kpost/Kpre vs restitution)",
      url: "/labs/_benchmarks/ch10/s04-energy-loss.json",
      kind: "dataset",
      status: "ready",
    },
  ],
  "v1-ch10-s05-relativistic-momentum": [
    {
      label: "Relativistic momentum p = gamma m v",
      url: "https://en.wikipedia.org/wiki/Momentum#Special_relativity",
      kind: "formula",
      status: "ready",
    },
    {
      label: "CH10 relativistic momentum profile (pr/pc vs beta)",
      url: "/labs/_benchmarks/ch10/s05-relativistic-momentum.json",
      kind: "dataset",
      status: "ready",
    },
  ],
  "v1-ch01-s01-introduction": [
    {
      label: "Lorentz factor and relativistic fit baseline",
      url: "https://en.wikipedia.org/wiki/Lorentz_factor",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Open velocity-momentum benchmark tables (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch01-s02-matter-is-made-of-atoms": [
    {
      label: "Lennard-Jones potential and reduced units",
      url: "https://en.wikipedia.org/wiki/Lennard-Jones_potential",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Open LJ reduced-fluid reference data (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch01-s03-atomic-processes": [
    {
      label: "Rate-equation style evaporation-condensation balance",
      url: "https://en.wikipedia.org/wiki/Hertz%E2%80%93Knudsen_equation",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Open dissolution/phase exchange data (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch01-s04-chemical-reactions": [
    {
      label: "Arrhenius equation and activation barrier slope",
      url: "https://en.wikipedia.org/wiki/Arrhenius_equation",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Open reaction-rate versus temperature datasets (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch12-s01-what-is-a-force": [
    {
      label: "Feynman Lectures V1 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/I_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch12-s02-friction": [
    {
      label: "Feynman Lectures V1 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/I_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch12-s03-molecular-forces": [
    {
      label: "Feynman Lectures V1 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/I_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch12-s04-fundamental-forces-fields": [
    {
      label: "Feynman Lectures V1 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/I_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch12-s05-pseudo-forces": [
    {
      label: "Feynman Lectures V1 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/I_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v1-ch12-s06-nuclear-forces": [
    {
      label: "Feynman Lectures V1 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/I_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s01-the-same-equations-have-the-same-solutions": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s02-the-flow-of-heat-a-point-source-near-an-infinite-plane-boundary": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s03-the-stretched-membrane": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s04-the-diffusion-of-neutrons-a-uniform-spherical-source-in-a-homogeneous-medium": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s05-irrotational-fluid-flow-the-flow-past-a-sphere": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s06-illumination-the-uniform-lighting-of-a-plane": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v2-ch12-s07-the-underlying-unity-of-nature": [
    {
      label: "Feynman Lectures V2 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/II_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v3-ch12-s01-base-states-for-a-system-with-two-spin-one-half-particles": [
    {
      label: "Feynman Lectures V3 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/III_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v3-ch12-s02-the-hamiltonian-for-the-ground-state-of-hydrogen": [
    {
      label: "Feynman Lectures V3 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/III_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v3-ch12-s03-the-energy-levels": [
    {
      label: "Feynman Lectures V3 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/III_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v3-ch12-s04-the-zeeman-splitting": [
    {
      label: "Feynman Lectures V3 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/III_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v3-ch12-s05-the-states-in-a-magnetic-field": [
    {
      label: "Feynman Lectures V3 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/III_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
  "v3-ch12-s06-the-projection-matrix-for-spin-one6": [
    {
      label: "Feynman Lectures V3 Chapter 12 analytic baseline",
      url: "https://www.feynmanlectures.caltech.edu/III_12.html",
      kind: "formula",
      status: "ready",
    },
    {
      label: "Chapter 12 public dataset (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
    },
  ],
};
