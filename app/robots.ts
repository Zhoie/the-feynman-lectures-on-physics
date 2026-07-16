import type { MetadataRoute } from "next";
import { getAbsoluteSiteUrl } from "@/core/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
    ],
    sitemap: getAbsoluteSiteUrl("/sitemap.xml"),
  };
}
