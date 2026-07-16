import type { ModuleType } from "../types";

export type Experiment = {
  id: string;
  title: string;
  description: string;
  goal: string;
  observation: string;
  module: ModuleType;
  params: Record<string, number>;
  tags: string[];
};
