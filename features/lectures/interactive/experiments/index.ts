import { volume1Experiments } from "./volume-1";
import { volume2Experiments } from "./volume-2";
import { volume3Experiments } from "./volume-3";
import type { Experiment } from "./types";

export type { Experiment } from "./types";

export const volumeExperiments: Record<
  "volume-1" | "volume-2" | "volume-3",
  Experiment[][]
> = {
  "volume-1": volume1Experiments,
  "volume-2": volume2Experiments,
  "volume-3": volume3Experiments,
};
