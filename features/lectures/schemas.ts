import { z } from "zod";
import { volumes } from "./data";

const volumeIds = volumes.map((volume) => volume.id) as [string, ...string[]];

export const volumeIdSchema = z.object({
  volumeId: z.enum(volumeIds),
});

export const chapterSlugSchema = z.object({
  chapterSlug: z.string().min(1),
});

export const transitionParamsSchema = z.object({
  volumeId: z.enum(volumeIds),
  from: z.string().min(1),
  to: z.string().min(1),
});
