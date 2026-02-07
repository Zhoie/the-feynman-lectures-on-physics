import type { ModuleConfig, ModulePreset, ModuleType } from "./types";

const fieldMotion: ModuleConfig = {
  type: "field-motion",
  title: "Field + Motion",
  description:
    "A single particle moves under a central restoring force and gravity. Adjust damping and kick to feel stability vs. drift.",
  params: {
    gravity: 0.6,
    stiffness: 1.8,
    damping: 0.18,
    kick: 2.4,
  },
  paramMeta: [
    { id: "gravity", label: "Gravity", min: -2, max: 2, step: 0.1, unit: "g" },
    { id: "stiffness", label: "Stiffness", min: 0.2, max: 4, step: 0.1 },
    { id: "damping", label: "Damping", min: 0, max: 1, step: 0.02 },
    { id: "kick", label: "Initial Kick", min: 0, max: 6, step: 0.2 },
  ],
  presets: [
    {
      id: "baseline",
      label: "Baseline",
      params: { gravity: 0.6, stiffness: 1.8, damping: 0.18, kick: 2.4 },
    },
    {
      id: "low-damping",
      label: "Low Damping",
      params: { gravity: 0.6, stiffness: 1.4, damping: 0.05, kick: 3.4 },
    },
    {
      id: "overdamped",
      label: "Overdamped",
      params: { gravity: 0.6, stiffness: 2.2, damping: 0.55, kick: 1.4 },
    },
  ],
};

const waveInterference: ModuleConfig = {
  type: "wave-interference",
  title: "Wave Interference",
  description:
    "Two traveling waves interfere. Change frequency, phase, and speed to see beats and standing patterns.",
  params: {
    amplitude: 1,
    frequency: 1.2,
    phase: 0,
    speed: 1.4,
  },
  paramMeta: [
    { id: "amplitude", label: "Amplitude", min: 0.2, max: 1.6, step: 0.05 },
    { id: "frequency", label: "Frequency", min: 0.4, max: 3, step: 0.1 },
    { id: "phase", label: "Phase Offset", min: 0, max: 6.28, step: 0.1 },
    { id: "speed", label: "Wave Speed", min: 0.4, max: 3, step: 0.1 },
  ],
  presets: [
    {
      id: "baseline",
      label: "Baseline",
      params: { amplitude: 1, frequency: 1.2, phase: 0, speed: 1.4 },
    },
    {
      id: "beats",
      label: "Beats",
      params: { amplitude: 1, frequency: 1.8, phase: 0.6, speed: 1.2 },
    },
    {
      id: "standing",
      label: "Standing",
      params: { amplitude: 1.1, frequency: 1.2, phase: 3.14, speed: 1 },
    },
  ],
};

const vectorField: ModuleConfig = {
  type: "vector-field",
  title: "Vector Field",
  description:
    "Visualize how two charges shape the surrounding field. Flip signs and spacing to feel attraction vs. repulsion.",
  params: {
    chargeA: 1.2,
    chargeB: -1,
    separation: 2.2,
    strength: 1,
  },
  paramMeta: [
    { id: "chargeA", label: "Charge A", min: -2, max: 2, step: 0.1 },
    { id: "chargeB", label: "Charge B", min: -2, max: 2, step: 0.1 },
    { id: "separation", label: "Separation", min: 0.8, max: 3.5, step: 0.1 },
    { id: "strength", label: "Field Strength", min: 0.5, max: 2, step: 0.1 },
  ],
  presets: [
    {
      id: "dipole",
      label: "Dipole",
      params: { chargeA: 1.2, chargeB: -1.2, separation: 2.1, strength: 1 },
    },
    {
      id: "repel",
      label: "Repel",
      params: { chargeA: 1, chargeB: 1, separation: 2.4, strength: 1 },
    },
    {
      id: "shield",
      label: "Shield",
      params: { chargeA: 1.6, chargeB: -0.6, separation: 1.4, strength: 1 },
    },
  ],
};

const rigidBody: ModuleConfig = {
  type: "rigid-body",
  title: "Rigid Body Lab",
  description:
    "A pair of blocks collide and slide under gravity. Tune restitution and friction to see energy loss.",
  params: {
    gravity: 9.8,
    restitution: 0.4,
    friction: 0.4,
    launch: 4,
  },
  paramMeta: [
    { id: "gravity", label: "Gravity", min: 0, max: 18, step: 0.2 },
    { id: "restitution", label: "Restitution", min: 0, max: 1, step: 0.05 },
    { id: "friction", label: "Friction", min: 0, max: 1, step: 0.05 },
    { id: "launch", label: "Launch Speed", min: 0, max: 8, step: 0.2 },
  ],
  presets: [
    {
      id: "baseline",
      label: "Baseline",
      params: { gravity: 9.8, restitution: 0.4, friction: 0.4, launch: 4 },
    },
    {
      id: "bouncy",
      label: "Bouncy",
      params: { gravity: 9.8, restitution: 0.85, friction: 0.2, launch: 3 },
    },
    {
      id: "sticky",
      label: "Sticky",
      params: { gravity: 9.8, restitution: 0.1, friction: 0.8, launch: 2 },
    },
  ],
};

const randomWalk: ModuleConfig = {
  type: "random-walk",
  title: "Random Walk",
  description:
    "Many particles jitter and diffuse. Adjust step size and drift to feel diffusion and bias.",
  params: {
    count: 160,
    step: 0.06,
    drift: 0,
    spread: 1,
  },
  paramMeta: [
    { id: "count", label: "Particles", min: 40, max: 320, step: 10 },
    { id: "step", label: "Step Size", min: 0.02, max: 0.2, step: 0.01 },
    { id: "drift", label: "Drift", min: -0.1, max: 0.1, step: 0.01 },
    { id: "spread", label: "Spread", min: 0.6, max: 2, step: 0.1 },
  ],
  presets: [
    {
      id: "baseline",
      label: "Baseline",
      params: { count: 160, step: 0.06, drift: 0, spread: 1 },
    },
    {
      id: "fast",
      label: "Fast Diffusion",
      params: { count: 200, step: 0.12, drift: 0, spread: 1.2 },
    },
    {
      id: "biased",
      label: "Biased Drift",
      params: { count: 140, step: 0.08, drift: 0.08, spread: 0.9 },
    },
  ],
};

const phaseSpace: ModuleConfig = {
  type: "phase-space",
  title: "Phase Space",
  description:
    "Track position versus velocity for a damped oscillator. The orbit reveals stability and steady-state cycles.",
  params: {
    frequency: 1.6,
    damping: 0.2,
    drive: 0.8,
    phase: 0,
  },
  paramMeta: [
    { id: "frequency", label: "Frequency", min: 0.6, max: 3, step: 0.1 },
    { id: "damping", label: "Damping", min: 0, max: 0.8, step: 0.02 },
    { id: "drive", label: "Drive", min: 0, max: 2, step: 0.05 },
    { id: "phase", label: "Drive Phase", min: 0, max: 6.28, step: 0.1 },
  ],
  presets: [
    {
      id: "baseline",
      label: "Baseline",
      params: { frequency: 1.6, damping: 0.2, drive: 0.8, phase: 0 },
    },
    {
      id: "limit-cycle",
      label: "Limit Cycle",
      params: { frequency: 1.3, damping: 0.1, drive: 1.4, phase: 0.4 },
    },
    {
      id: "overdamped",
      label: "Overdamped",
      params: { frequency: 1.6, damping: 0.6, drive: 0.5, phase: 0 },
    },
  ],
};

const circuitResponse: ModuleConfig = {
  type: "circuit-response",
  title: "Circuit Response",
  description:
    "A simplified RLC step response. Adjust damping and resonance to see overshoot or smooth settling.",
  params: {
    naturalFreq: 1.4,
    dampingRatio: 0.25,
    drive: 1,
    phase: 0,
  },
  paramMeta: [
    { id: "naturalFreq", label: "Natural Frequency", min: 0.6, max: 3, step: 0.1 },
    { id: "dampingRatio", label: "Damping Ratio", min: 0.05, max: 1.2, step: 0.05 },
    { id: "drive", label: "Input Step", min: 0.5, max: 1.5, step: 0.05 },
    { id: "phase", label: "Phase Offset", min: 0, max: 6.28, step: 0.1 },
  ],
  presets: [
    {
      id: "underdamped",
      label: "Underdamped",
      params: { naturalFreq: 1.6, dampingRatio: 0.2, drive: 1, phase: 0 },
    },
    {
      id: "critical",
      label: "Critical",
      params: { naturalFreq: 1.4, dampingRatio: 1, drive: 1, phase: 0 },
    },
    {
      id: "overdamped",
      label: "Overdamped",
      params: { naturalFreq: 1.2, dampingRatio: 1.1, drive: 1, phase: 0 },
    },
  ],
};

const quantumAmplitude: ModuleConfig = {
  type: "quantum-amplitude",
  title: "Quantum Amplitude",
  description:
    "Two-path interference builds a probability pattern. Adjust coherence and phase to see fringe visibility change.",
  params: {
    slitSeparation: 1.4,
    phase: 0,
    coherence: 1,
    spread: 1,
  },
  paramMeta: [
    { id: "slitSeparation", label: "Slit Separation", min: 0.6, max: 2.4, step: 0.1 },
    { id: "phase", label: "Phase Offset", min: 0, max: 6.28, step: 0.1 },
    { id: "coherence", label: "Coherence", min: 0, max: 1, step: 0.05 },
    { id: "spread", label: "Wave Spread", min: 0.6, max: 2, step: 0.1 },
  ],
  presets: [
    {
      id: "coherent",
      label: "Coherent",
      params: { slitSeparation: 1.4, phase: 0, coherence: 1, spread: 1 },
    },
    {
      id: "decohere",
      label: "Decoherence",
      params: { slitSeparation: 1.4, phase: 0, coherence: 0.2, spread: 1 },
    },
    {
      id: "wide-slit",
      label: "Wide Slit",
      params: { slitSeparation: 2, phase: 0.6, coherence: 1, spread: 1.4 },
    },
  ],
};

const spacetime: ModuleConfig = {
  type: "spacetime",
  title: "Spacetime Diagram",
  description:
    "Worldlines and light signals reveal time dilation. Increase velocity to stretch moving-clock ticks.",
  params: {
    velocity: 0.6,
    separation: 1.4,
    ticks: 6,
  },
  paramMeta: [
    { id: "velocity", label: "Velocity (c)", min: 0, max: 0.9, step: 0.05 },
    { id: "separation", label: "Mirror Separation", min: 0.6, max: 2.4, step: 0.1 },
    { id: "ticks", label: "Ticks", min: 3, max: 10, step: 1 },
  ],
  presets: [
    {
      id: "slow",
      label: "Slow",
      params: { velocity: 0.3, separation: 1.2, ticks: 6 },
    },
    {
      id: "fast",
      label: "Fast",
      params: { velocity: 0.75, separation: 1.2, ticks: 6 },
    },
    {
      id: "wide",
      label: "Wide",
      params: { velocity: 0.5, separation: 2, ticks: 6 },
    },
  ],
};

const templates: Record<ModuleType, ModuleConfig> = {
  "field-motion": fieldMotion,
  "wave-interference": waveInterference,
  "vector-field": vectorField,
  "rigid-body": rigidBody,
  "random-walk": randomWalk,
  "phase-space": phaseSpace,
  "circuit-response": circuitResponse,
  "quantum-amplitude": quantumAmplitude,
  "spacetime": spacetime,
};

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

export function createModuleConfig(
  type: ModuleType,
  overrides?: Partial<ModuleConfig>
): ModuleConfig {
  const base = clone(templates[type]);
  return {
    ...base,
    ...overrides,
    params: {
      ...base.params,
      ...(overrides?.params ?? {}),
    },
    paramMeta: overrides?.paramMeta ?? base.paramMeta,
    presets: mergePresets(base.presets, overrides?.presets),
  };
}

function mergePresets(
  base: ModulePreset[],
  overrides?: ModulePreset[]
): ModulePreset[] {
  if (!overrides || overrides.length === 0) return base;
  return overrides.map((preset) => ({
    ...preset,
    params: { ...base[0]?.params, ...preset.params },
  }));
}
