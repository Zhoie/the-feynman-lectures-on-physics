import type { Chapter, Volume } from "./data";
import { volumes } from "./data";
import { volumeExperiments, type Experiment } from "./interactive/experiments";
import { createModuleConfig } from "./interactive/templates";
import type { ModuleParameter } from "./interactive/types";

export type ChapterExperiment = Experiment & { paramMeta: ModuleParameter[] };

let validated = false;

function toConfig(experiment: Experiment): ChapterExperiment {
  const template = createModuleConfig(experiment.module);
  return {
    ...experiment,
    paramMeta: template.paramMeta,
  };
}

function validateExperimentParams(experiment: Experiment, chapterLabel: string) {
  const template = createModuleConfig(experiment.module);
  const meta = template.paramMeta;
  const paramKeys = Object.keys(experiment.params);

  meta.forEach((param) => {
    if (!paramKeys.includes(param.id)) {
      throw new Error(
        `Missing param '${param.id}' in ${experiment.id} (${chapterLabel}).`
      );
    }
    const value = experiment.params[param.id];
    if (value < param.min || value > param.max) {
      throw new Error(
        `Param '${param.id}' out of range in ${experiment.id} (${chapterLabel}).`
      );
    }
  });

  paramKeys.forEach((key) => {
    if (!meta.find((param) => param.id === key)) {
      throw new Error(
        `Unknown param '${key}' in ${experiment.id} (${chapterLabel}).`
      );
    }
  });
}

function validateChapterExperiments() {
  const idSet = new Set<string>();

  volumes.forEach((volume) => {
    const volumeSet =
      volumeExperiments[volume.id as keyof typeof volumeExperiments];
    if (!volumeSet) {
      throw new Error(`Missing experiments for ${volume.id}.`);
    }
    if (volumeSet.length !== volume.chapters.length) {
      throw new Error(
        `Experiment count mismatch for ${volume.id}: expected ${volume.chapters.length}, got ${volumeSet.length}.`
      );
    }
    volume.chapters.forEach((chapter, index) => {
      const chapterSet = volumeSet[index];
      if (!chapterSet) {
        throw new Error(
          `Missing experiments for ${volume.id} chapter ${chapter.index}.`
        );
      }
      if (chapterSet.length < 2 || chapterSet.length > 3) {
        throw new Error(
          `Chapter ${volume.id} ${chapter.label} must have 2-3 experiments.`
        );
      }
      chapterSet.forEach((experiment) => {
        if (idSet.has(experiment.id)) {
          throw new Error(
            `Duplicate experiment id detected: ${experiment.id}.`
          );
        }
        idSet.add(experiment.id);
        validateExperimentParams(
          experiment,
          `${volume.id} ${chapter.label} ${chapter.title}`
        );
      });
    });
  });
}

export function getChapterExperiments(
  volume: Volume,
  chapter: Chapter
): ChapterExperiment[] {
  if (!validated && process.env.NODE_ENV !== "production") {
    validateChapterExperiments();
    validated = true;
  }

  const typedVolumeSet =
    volumeExperiments[volume.id as keyof typeof volumeExperiments];
  const chapterSet = typedVolumeSet?.[chapter.index - 1];

  if (!chapterSet) {
    throw new Error(
      `Missing experiments for ${volume.id} ${chapter.label} (${chapter.title}).`
    );
  }

  return chapterSet.map((experiment) => toConfig(experiment));
}
