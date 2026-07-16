import { z } from "zod";

type SiteEnvironment = {
  NEXT_PUBLIC_SITE_URL?: string;
  VERCEL?: string;
  VERCEL_PROJECT_PRODUCTION_URL?: string;
  VERCEL_URL?: string;
};

const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => {
      const protocol = new URL(value).protocol;
      return protocol === "http:" || protocol === "https:";
    },
    { message: "Site URL must use HTTP or HTTPS." },
  );

function parseSiteUrl(value: string, source: string) {
  const parsed = httpUrlSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Invalid ${source}: ${parsed.error.issues[0]?.message}`);
  }

  const url = new URL(parsed.data);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  return url;
}

function vercelUrl(value?: string) {
  const host = value?.trim();
  return host ? `https://${host}` : null;
}

function currentSiteEnvironment(): SiteEnvironment {
  return {
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    VERCEL: process.env.VERCEL,
    VERCEL_PROJECT_PRODUCTION_URL:
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
    VERCEL_URL: process.env.VERCEL_URL,
  };
}

export function getSiteUrl(
  environment: SiteEnvironment = currentSiteEnvironment(),
) {
  const explicitUrl = environment.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicitUrl) {
    return parseSiteUrl(explicitUrl, "NEXT_PUBLIC_SITE_URL");
  }

  const deploymentUrl =
    vercelUrl(environment.VERCEL_PROJECT_PRODUCTION_URL) ??
    vercelUrl(environment.VERCEL_URL);
  if (deploymentUrl) {
    return parseSiteUrl(deploymentUrl, "Vercel deployment URL");
  }

  if (environment.VERCEL === "1") {
    throw new Error(
      "A production site URL is required for metadata, robots, and sitemap output.",
    );
  }

  return new URL("http://localhost:3000");
}

export function getAbsoluteSiteUrl(
  path: string,
  environment: SiteEnvironment = currentSiteEnvironment(),
) {
  return new URL(path, getSiteUrl(environment)).toString();
}
