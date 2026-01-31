import type { MetadataRoute } from "next";
import { volumes } from "@/features/lectures/data";
import { getAllTransitionParams } from "@/features/lectures/lib/lectures";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
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

  return urls.map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: new Date(),
  }));
}
