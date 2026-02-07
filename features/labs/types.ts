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
};

export type ChartPoint = {
  x: number;
  y: number;
};

export type ChartSeries = {
  id: string;
  label: string;
  data: ChartPoint[];
  color?: string;
};

export type ChartSpec = {
  id: string;
  title: string;
  series: ChartSeries[];
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

export type LabModel<P extends Record<string, number>, S> = {
  id: string;
  title: string;
  summary: string;
  archetype: string;
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
};
