import { describe, expect, it } from "vitest";
import { getLabSections } from "./manifest";
import { registeredLabIds } from "./registered-lab-ids";
import { labViewLoaders, loadLabView } from "./registry";

describe("labs registry", () => {
  it("keeps registered ids, manifest sections, and loaders aligned", () => {
    const manifestIds = new Set(
      getLabSections().map((section) => section.labId),
    );
    const missingManifestEntries = registeredLabIds.filter(
      (labId) => !manifestIds.has(labId),
    );

    expect(missingManifestEntries).toEqual([]);
    expect(Object.keys(labViewLoaders).sort()).toEqual(
      [...registeredLabIds].sort(),
    );
  });

  it("loads every registered lab view", async () => {
    for (const labId of registeredLabIds) {
      const view = await loadLabView(labId);
      expect(view, `${labId} should resolve to a view`).toBeTypeOf("function");
    }
  });
});
