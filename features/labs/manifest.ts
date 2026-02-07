import manifestData from "@/manifest.json";

export type LabSection = {
  id: string;
  labId: string;
  volumeId: string;
  volumeNumber: number;
  chapterIndex: number;
  chapterTitle: string;
  chapterSlug: string;
  sectionNumber: string;
  sectionIndex: number;
  sectionTitle: string;
  sectionSlug: string;
  archetype: string | null;
};

export type LabManifest = {
  version: number;
  generatedAt: string;
  sections: LabSection[];
};

export const labManifest = manifestData as LabManifest;

export function getLabSections() {
  return labManifest.sections;
}

export function getSectionByLabId(labId: string) {
  return labManifest.sections.find((section) => section.labId === labId);
}

export function getChapterSections(volumeId: string, chapterIndex: number) {
  return labManifest.sections.filter(
    (section) =>
      section.volumeId === volumeId && section.chapterIndex === chapterIndex
  );
}
