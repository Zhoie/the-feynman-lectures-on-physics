export const moduleTypes = [
  "field-motion",
  "wave-interference",
  "vector-field",
  "rigid-body",
  "random-walk",
  "phase-space",
  "circuit-response",
  "quantum-amplitude",
  "spacetime",
] as const;

export type ModuleType = (typeof moduleTypes)[number];

export type ModuleParameter = {
  id: string;
  label: string;
  min: number;
  max: number;
  step: number;
  unit?: string;
};

export type ModulePreset = {
  id: string;
  label: string;
  params: Record<string, number>;
};

export type ModuleConfig = {
  type: ModuleType;
  title: string;
  description: string;
  params: Record<string, number>;
  paramMeta: ModuleParameter[];
  presets: ModulePreset[];
};
