import { volumes } from "../data";
import type { Chapter, Volume } from "../data";

export function getVolumeById(volumeId: string) {
  return volumes.find((volume) => volume.id === volumeId) ?? null;
}

export function getChapterBySlug(volume: Volume, slug: string) {
  const index = volume.chapters.findIndex((chapter) => chapter.slug === slug);
  if (index === -1) return null;
  return {
    chapter: volume.chapters[index],
    index,
  };
}

export function getChapter(volumeId: string, chapterSlug: string) {
  const volume = getVolumeById(volumeId);
  if (!volume) return null;
  const result = getChapterBySlug(volume, chapterSlug);
  if (!result) return null;
  return {
    volume,
    chapter: result.chapter,
    index: result.index,
  };
}

export function getChapterNeighbors(volumeId: string, chapterSlug: string) {
  const found = getChapter(volumeId, chapterSlug);
  if (!found) return null;
  const { volume, index } = found;
  const previous = index > 0 ? volume.chapters[index - 1] : null;
  const next = index < volume.chapters.length - 1 ? volume.chapters[index + 1] : null;
  return {
    volume,
    previous,
    current: found.chapter,
    next,
  };
}

export function getVolumeNavigation(volumeId: string) {
  const index = volumes.findIndex((volume) => volume.id === volumeId);
  if (index === -1) return null;
  return {
    previous: index > 0 ? volumes[index - 1] : null,
    current: volumes[index],
    next: index < volumes.length - 1 ? volumes[index + 1] : null,
  };
}

export function getTransition(volumeId: string, fromSlug: string, toSlug: string) {
  const volume = getVolumeById(volumeId);
  if (!volume) return null;
  const fromIndex = volume.chapters.findIndex((chapter) => chapter.slug === fromSlug);
  if (fromIndex === -1) return null;
  const toChapter = volume.chapters[fromIndex + 1];
  if (!toChapter || toChapter.slug !== toSlug) return null;
  return {
    volume,
    from: volume.chapters[fromIndex],
    to: toChapter,
    index: fromIndex,
  };
}

export function getAllTransitionParams() {
  return volumes.flatMap((volume) =>
    volume.chapters.slice(0, -1).map((chapter, index) => ({
      volumeId: volume.id,
      from: chapter.slug,
      to: volume.chapters[index + 1].slug,
    }))
  );
}

export function getChapterOrder(volume: Volume, chapter: Chapter) {
  return `${volume.title} ${chapter.label}`;
}
