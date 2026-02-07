import { z } from "zod";
import { volumes } from "./data";
import { moduleTypes } from "./interactive/types";

const volumeIds = volumes.map((volume) => volume.id) as [string, ...string[]];
const normalizeParam = (value: unknown) =>
  Array.isArray(value) ? value[0] : value;

export const volumeIdSchema = z.object({
  volumeId: z.enum(volumeIds),
});

export const chapterSlugSchema = z.object({
  chapterSlug: z.string().min(1),
});

export const chapterPanelSchema = z.enum([
  "intuition",
  "experiment",
  "math",
  "echo",
]);

export const volumeSearchParamsSchema = z.object({
  q: z.preprocess(
    normalizeParam,
    z.string().trim().max(60).optional()
  ),
});

export const chapterSearchParamsSchema = z.object({
  panel: z.preprocess(normalizeParam, chapterPanelSchema.optional()),
  experiment: z.preprocess(normalizeParam, z.string().max(64).optional()),
  module: z.preprocess(normalizeParam, z.enum(moduleTypes).optional()),
  preset: z.preprocess(normalizeParam, z.string().max(40).optional()),
});

export const transitionParamsSchema = z.object({
  volumeId: z.enum(volumeIds),
  from: z.string().min(1),
  to: z.string().min(1),
});
