export type ControlOption = {
  label: string;
  value: number;
};

export type ControlSpec = {
  id: string;
  label: string;
  type?: "range" | "select";
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  default: number;
  options?: ControlOption[];
  visibleWhen?: (params: Record<string, number>) => boolean;
};

export type MetricValue = {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
  precision?: number;
  reference?: number | string;
  tolerance?: number;
  status?: "ok" | "warn" | "fail";
};

export type ChartPoint = {
  x: number;
  y: number;
};

export type ChartBandPoint = {
  x: number;
  yMin: number;
  yMax: number;
};

export type ChartSeries = {
  id: string;
  label: string;
  data: ChartPoint[];
  color?: string;
  role?: "simulation" | "reference";
  lineStyle?: "solid" | "dashed";
};

export type ChartSpec = {
  id: string;
  title: string;
  series: ChartSeries[];
  bands?: {
    id: string;
    label?: string;
    data: ChartBandPoint[];
    color?: string;
  }[];
  xLabel?: string;
  yLabel?: string;
  xRange?: [number, number];
  yRange?: [number, number];
};

export type CanvasSize = {
  width: number;
  height: number;
  dpr: number;
};

export type SimulationConfig = {
  fixedDt: number;
  maxSubSteps: number;
  maxFrameDt?: number;
};

export type ModelSource = {
  label: string;
  url: string;
  kind: "formula" | "dataset";
  status?: "ready" | "pending";
};

export type ModelMeta = {
  fidelity: "qualitative" | "quantitative";
  assumptions: string[];
  validRange: string[];
  sources: ModelSource[];
  notes?: string;
};

export type ValidationCheck = {
  id: string;
  label: string;
  value: number | string;
  reference?: number | string;
  tolerance?: number;
  status: "ok" | "warn" | "fail";
  message?: string;
};

export type ValidationResult = {
  status: "ok" | "warn" | "fail";
  checks: ValidationCheck[];
  warnings?: string[];
};

export type LabModel<P extends Record<string, number>, S> = {
  id: string;
  title: string;
  summary: string;
  archetype: string;
  simulation?: SimulationConfig;
  meta?: ModelMeta;
  params: ControlSpec[];
  create: (params: P) => S;
  step: (state: S, params: P, dt: number) => void;
  draw: (
    ctx: CanvasRenderingContext2D,
    state: S,
    params: P,
    size: CanvasSize
  ) => void;
  metrics: (state: S, params: P) => MetricValue[];
  charts?: (state: S, params: P) => ChartSpec[];
  validate?: (state: S, params: P) => ValidationResult;
};
