import { describe, expect, it } from "vitest";
import { volumes } from "./data";
import { getChapterExperiments } from "./interactive-map";
import { createModuleConfig } from "./interactive/templates";

const volumeOne = volumes.find((volume) => volume.id === "volume-1");
const chapterOne = volumeOne?.chapters.find(
  (chapter) => chapter.slug === "atoms-in-motion"
);

describe("chapter interactive experiments", () => {
  it("maps chapter 1 to four section-level experiments", () => {
    expect(volumeOne).toBeDefined();
    expect(chapterOne).toBeDefined();
    if (!volumeOne || !chapterOne) throw new Error("chapter 1 fixture missing");

    const experiments = getChapterExperiments(volumeOne, chapterOne);

    expect(experiments.map((experiment) => experiment.title)).toEqual([
      "1-1 Atomic Motion",
      "1-2 Brownian Diffusion",
      "1-3 Phase Exchange",
      "1-4 Reaction Coordinate",
    ]);
  });

  it("keeps chapter 1 experiment params inside module ranges", () => {
    expect(volumeOne).toBeDefined();
    expect(chapterOne).toBeDefined();
    if (!volumeOne || !chapterOne) throw new Error("chapter 1 fixture missing");

    const experiments = getChapterExperiments(volumeOne, chapterOne);

    for (const experiment of experiments) {
      const template = createModuleConfig(experiment.module);
      for (const param of template.paramMeta) {
        const value = experiment.params[param.id];
        expect(value).toBeGreaterThanOrEqual(param.min);
        expect(value).toBeLessThanOrEqual(param.max);
      }
    }
  });
});
