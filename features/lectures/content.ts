import type { Chapter, Volume } from "./data";

export type ChapterPanel = {
  id: "intuition" | "experiment" | "math" | "echo";
  label: string;
  title: string;
  text: string;
};

export type ChapterContent = {
  summary: string;
  keyIdeas: string[];
  experiments: string[];
  mathFocus: string[];
  modernEcho: string[];
  panels?: ChapterPanel[];
};

const curatedContent: Record<string, ChapterContent> = {
  "volume-1/atoms-in-motion": {
    summary:
      "Opens the course with the atomic hypothesis, using Brownian motion and diffusion to connect microscopic collisions to macroscopic motion.",
    keyIdeas: [
      "Matter is made of atoms in constant motion.",
      "Random motion produces predictable averages.",
      "Microscopic collisions explain diffusion and viscosity.",
    ],
    experiments: [
      "Brownian motion under the microscope.",
      "Perrin-style measurements for Avogadro's number.",
      "Gas diffusion and viscosity comparisons.",
    ],
    mathFocus: [
      "Random-walk scaling with sqrt(N).",
      "Mean free path estimates.",
      "Order-of-magnitude reasoning.",
    ],
    modernEcho: [
      "Nanoparticle tracking in fluids.",
      "Molecular dynamics simulations.",
      "Microfluidic diffusion assays.",
    ],
  },
  "volume-1/basic-physics": {
    summary:
      "Defines what physics tries to do: compress complex phenomena into simple models, measured in consistent units and tested by experiment.",
    keyIdeas: [
      "Physics builds models that trade detail for predictive power.",
      "Units and dimensional analysis prevent nonsense.",
      "Approximation is a feature, not a flaw.",
    ],
    experiments: [
      "Pendulum timing as a baseline measurement.",
      "Calibration of length and time standards.",
      "Simple conservation checks in the lab.",
    ],
    mathFocus: [
      "Dimensional consistency as a constraint.",
      "Scaling laws and proportionality.",
      "First-order approximations.",
    ],
    modernEcho: [
      "Modeling and simulation workflows.",
      "Metrology standards in engineering.",
      "Data-driven validation loops.",
    ],
  },
  "volume-1/the-relation-of-physics-to-other-sciences": {
    summary:
      "Maps how physics feeds chemistry, biology, and geology while acknowledging new rules and structures at higher levels of organization.",
    keyIdeas: [
      "Reduction connects disciplines, but new laws emerge at scale.",
      "Physics provides tools, not complete explanations.",
      "Cross-disciplinary feedback refines physical theories.",
    ],
    experiments: [
      "Spectroscopy as a bridge to chemistry.",
      "X-ray diffraction for molecular structure.",
      "Radioisotope tracing in biology.",
    ],
    mathFocus: [
      "Statistical descriptions of large systems.",
      "Energy landscapes and stability.",
      "Rates and scaling across time scales.",
    ],
    modernEcho: [
      "Biophysics and systems biology.",
      "Materials science and nanotechnology.",
      "Climate and earth system modeling.",
    ],
  },
  "volume-1/conservation-of-energy": {
    summary:
      "Establishes energy as a conserved bookkeeping tool that shifts forms while remaining constant in isolated systems.",
    keyIdeas: [
      "Energy is conserved across transformations.",
      "Potential and kinetic energy trade predictably.",
      "Energy accounting reveals hidden mechanisms.",
    ],
    experiments: [
      "Joule's mechanical equivalent of heat.",
      "Pendulum energy exchange.",
      "Spring-mass energy transfer.",
    ],
    mathFocus: [
      "Work as a line integral of force.",
      "Energy conservation equations.",
      "Potential energy functions.",
    ],
    modernEcho: [
      "Energy budgets in engines.",
      "Battery efficiency analysis.",
      "Power flow in grids.",
    ],
  },
  "volume-1/time-and-distance": {
    summary:
      "Clarifies how we define and measure length and time, emphasizing operational definitions, uncertainty, and reference frames.",
    keyIdeas: [
      "Measurement relies on agreed procedures.",
      "Synchronization and delay shape timekeeping.",
      "Reference frames anchor distance definitions.",
    ],
    experiments: [
      "Light-pulse timing measurements.",
      "Interferometric length comparisons.",
      "Clock calibration against standards.",
    ],
    mathFocus: [
      "Speed as distance over time.",
      "Propagation delays and signal timing.",
      "Uncertainty propagation basics.",
    ],
    modernEcho: [
      "Atomic time standards.",
      "GPS synchronization.",
      "High-precision metrology.",
    ],
  },
  "volume-2/electrostatics": {
    summary:
      "Introduces electric charge, Coulomb's law, and the electric field as a way to describe forces without direct contact.",
    keyIdeas: [
      "Charges exert forces through fields.",
      "Superposition builds complex fields.",
      "Charge is conserved and quantized.",
    ],
    experiments: [
      "Coulomb torsion balance.",
      "Electroscope charge detection.",
      "Van de Graaff charge buildup.",
    ],
    mathFocus: [
      "Coulomb's law.",
      "Field of a point charge.",
      "Potential and potential energy.",
    ],
    modernEcho: [
      "Capacitive touch sensors.",
      "Electrostatic printing.",
      "High-voltage insulation design.",
    ],
  },
  "volume-2/electric-fields-in-matter": {
    summary:
      "Explains how materials polarize in electric fields and how bound charges reshape the total field.",
    keyIdeas: [
      "Polarization reduces internal fields.",
      "Bound charge complements free charge.",
      "Material response depends on structure.",
    ],
    experiments: [
      "Capacitor insertion with dielectric.",
      "Polarization under applied field.",
      "Dielectric breakdown tests.",
    ],
    mathFocus: [
      "Electric susceptibility.",
      "Relation between E and D fields.",
      "Boundary conditions at interfaces.",
    ],
    modernEcho: [
      "Dielectrics in microelectronics.",
      "Ferroelectric memory materials.",
      "Insulation engineering.",
    ],
  },
  "volume-2/divergence-of-electric-field": {
    summary:
      "Connects electric field divergence to charge density, setting up the local form of Gauss's law.",
    keyIdeas: [
      "Field lines begin and end on charges.",
      "Divergence measures local sources.",
      "Symmetry simplifies field solutions.",
    ],
    experiments: [
      "Field mapping with probes.",
      "Charge distribution on conductors.",
      "Capacitor field visualization.",
    ],
    mathFocus: [
      "Gauss's law (differential form).",
      "Flux and divergence connection.",
      "Field line density intuition.",
    ],
    modernEcho: [
      "Finite-element electrostatics.",
      "Sensor field design.",
      "Electrostatic shielding analysis.",
    ],
  },
  "volume-3/quantum-behavior": {
    summary:
      "Shows how quantum systems use probability amplitudes and interference, overturning classical expectations.",
    keyIdeas: [
      "Particles show wave-like interference.",
      "Measurement changes what can be predicted.",
      "Probabilities come from amplitudes.",
    ],
    experiments: [
      "Electron double-slit interference.",
      "Photoelectric effect snapshots.",
      "Single-photon interference.",
    ],
    mathFocus: [
      "Complex amplitudes.",
      "Superposition and interference.",
      "Normalization of probabilities.",
    ],
    modernEcho: [
      "Quantum sensors.",
      "Interferometric lithography.",
      "Foundations of quantum computing.",
    ],
  },
  "volume-3/wave-particle-duality": {
    summary:
      "Develops de Broglie matter waves and complementarity, showing how waves and particles are two views of the same phenomena.",
    keyIdeas: [
      "Matter has a wavelength.",
      "Wave and particle pictures are complementary.",
      "Uncertainty limits simultaneous precision.",
    ],
    experiments: [
      "Davisson-Germer electron diffraction.",
      "Neutron diffraction in crystals.",
      "Electron microscope interference.",
    ],
    mathFocus: [
      "de Broglie wavelength.",
      "Phase and group velocity.",
      "Uncertainty relations.",
    ],
    modernEcho: [
      "Electron microscopy.",
      "Atom interferometry.",
      "Quantum metrology.",
    ],
  },
  "volume-3/probability-amplitudes": {
    summary:
      "Builds the rules for probability amplitudes, emphasizing how complex numbers encode interference and measurement statistics.",
    keyIdeas: [
      "Amplitudes add, probabilities are squared.",
      "Phase controls interference outcomes.",
      "States must be normalized.",
    ],
    experiments: [
      "Mach-Zehnder interferometer.",
      "Two-state interference experiments.",
      "Phase-shift measurements.",
    ],
    mathFocus: [
      "Complex-number algebra.",
      "Inner products and normalization.",
      "Unitary evolution intuition.",
    ],
    modernEcho: [
      "Quantum algorithm design.",
      "Amplitude estimation techniques.",
      "Error mitigation in qubits.",
    ],
  },
};

const volumeThemes: Record<string, string> = {
  "volume-1": "mechanics, waves, heat, and relativity",
  "volume-2": "electric and magnetic fields, circuits, and material response",
  "volume-3": "quantum behavior, amplitudes, and atomic structure",
};

function defaultContent(volume: Volume, chapter: Chapter): ChapterContent {
  const theme = volumeThemes[volume.id] ?? "core physics ideas";
  return {
    summary: `${chapter.title} builds intuition for ${theme}. Use this lecture to define the main quantities, the experimental handles, and the simplest mathematical model that explains the effect.`,
    keyIdeas: [
      "Identify the measurable quantities and their units.",
      "Track conserved or approximately conserved quantities.",
      "Connect microscopic behavior to macroscopic trends.",
    ],
    experiments: [
      "A clean tabletop demonstration of the core effect.",
      "A measurement that isolates the dominant variable.",
      "A limiting case that reveals the underlying law.",
    ],
    mathFocus: [
      "Dimensional analysis to check the model.",
      "The simplest equation that captures the effect.",
      "Limit cases that bracket the answer.",
    ],
    modernEcho: [
      "Simulation or computation of the phenomenon.",
      "Sensor or measurement technology that relies on it.",
      "Engineering constraints shaped by this idea.",
    ],
  };
}

function buildPanels(content: ChapterContent, chapter: Chapter): ChapterPanel[] {
  return [
    {
      id: "intuition",
      label: "Intuition",
      title: "Physical story",
      text:
        content.panels?.find((panel) => panel.id === "intuition")?.text ??
        `Sketch the physical picture behind ${chapter.title}. ${content.keyIdeas[0]}`,
    },
    {
      id: "experiment",
      label: "Experiment",
      title: "Laboratory cue",
      text:
        content.panels?.find((panel) => panel.id === "experiment")?.text ??
        content.experiments[0],
    },
    {
      id: "math",
      label: "Mathematics",
      title: "Equation focus",
      text:
        content.panels?.find((panel) => panel.id === "math")?.text ??
        content.mathFocus[0],
    },
    {
      id: "echo",
      label: "Modern Echo",
      title: "Contemporary link",
      text:
        content.panels?.find((panel) => panel.id === "echo")?.text ??
        content.modernEcho[0],
    },
  ];
}

export function getChapterContent(volume: Volume, chapter: Chapter) {
  const key = `${volume.id}/${chapter.slug}`;
  const content = curatedContent[key] ?? defaultContent(volume, chapter);
  return {
    ...content,
    panels: buildPanels(content, chapter),
  };
}
