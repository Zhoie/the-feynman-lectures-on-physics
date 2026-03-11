import { describe, expect, it } from "vitest";
import { getLabSections } from "./manifest";
import { hasLab, loadLabView } from "./registry";

describe("labs registry", () => {
  it("registers every chapter-12 lab id from manifest", () => {
    const ch12 = getLabSections().filter((section) => section.chapterIndex === 12);
    const missing = ch12
      .filter((section) => !hasLab(section.labId))
      .map((section) => section.labId);
    expect(missing, `missing chapter-12 lab ids: ${missing.join(", ")}`).toEqual([]);
  });

  it("loads all chapter-12 lab views", async () => {
    const ch12 = getLabSections().filter((section) => section.chapterIndex === 12);
    for (const section of ch12) {
      const view = await loadLabView(section.labId);
      expect(view, `${section.labId} should resolve to a view`).toBeTypeOf("function");
    }
  });
});
