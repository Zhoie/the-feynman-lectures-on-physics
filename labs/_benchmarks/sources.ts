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
      label: "Open mechanics force-sensor lab datasets (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
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
      label: "Open air-track collision datasets (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
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
      label: "Open recoil cart experiment datasets (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
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
      label: "Open collision-energy datasets (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
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
      label: "Particle-track momentum datasets (curation pending)",
      url: "/labs/_benchmarks/README.md#pending-datasets",
      kind: "dataset",
      status: "pending",
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
};
