import type { MetadataRoute } from "next";
import { getAbsoluteSiteUrl } from "@/core/config/site";
import { registeredLabIds } from "@/features/labs/registered-lab-ids";
import { volumes } from "@/features/lectures/data";
import { getAllTransitionParams } from "@/features/lectures/lib/lectures";

export default function sitemap(): MetadataRoute.Sitemap {
  const urls: string[] = ["/"];

  for (const volume of volumes) {
    urls.push(`/volume/${volume.id}`);
    for (const chapter of volume.chapters) {
      urls.push(`/volume/${volume.id}/${chapter.slug}`);
    }
  }

  for (const transition of getAllTransitionParams()) {
    urls.push(
      `/volume/${transition.volumeId}/transition/${transition.from}/${transition.to}`
    );
  }

  for (const labId of registeredLabIds) {
    urls.push(`/lab/${labId}`);
  }

  return urls.map((path) => ({
    url: getAbsoluteSiteUrl(path),
    lastModified: new Date(),
  }));
}
