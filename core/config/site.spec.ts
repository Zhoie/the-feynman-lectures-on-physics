import { describe, expect, it } from "vitest";
import { getAbsoluteSiteUrl, getSiteUrl } from "./site";

describe("site URL configuration", () => {
  it("normalizes an explicit public URL", () => {
    expect(
      getSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://physics.example/atlas?q=1",
      }).toString(),
    ).toBe("https://physics.example/");
  });

  it("uses the production Vercel hostname when available", () => {
    expect(
      getAbsoluteSiteUrl("/volume/volume-1", {
        VERCEL_PROJECT_PRODUCTION_URL: "physics.example",
      }),
    ).toBe("https://physics.example/volume/volume-1");
  });

  it("rejects invalid explicit URLs", () => {
    expect(() =>
      getSiteUrl({ NEXT_PUBLIC_SITE_URL: "javascript:alert(1)" }),
    ).toThrow("Invalid NEXT_PUBLIC_SITE_URL");
  });

  it("requires deployment metadata on Vercel", () => {
    expect(() => getSiteUrl({ VERCEL: "1" })).toThrow(
      "A production site URL is required",
    );
  });

  it("allows localhost for local builds", () => {
    expect(getSiteUrl({}).toString()).toBe("http://localhost:3000/");
  });
});
