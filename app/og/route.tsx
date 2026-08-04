import { ImageResponse } from "next/og";

export const runtime = "nodejs";

function sanitizeText(value: string, maximumLength: number) {
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}

function getParam(
  url: string,
  key: string,
  fallback: string,
  maximumLength: number,
) {
  const { searchParams } = new URL(url);
  const value = sanitizeText(searchParams.get(key) ?? "", maximumLength);
  return value || fallback;
}

export function GET(request: Request) {
  const title = getParam(
    request.url,
    "title",
    "The Feynman Lectures on Physics",
    90,
  );
  const subtitle = getParam(
    request.url,
    "subtitle",
    "Interactive Atlas",
    110,
  );
  const meta = getParam(
    request.url,
    "meta",
    "Volumes and Chapters",
    70,
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          background:
            "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(14,165,233,0.12), rgba(16,185,129,0.12))",
          color: "#0f172a",
          fontFamily: "serif",
        }}
      >
        <div style={{ fontSize: 28, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(15,23,42,0.55)" }}>
          {meta}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.1 }}>
            {title}
          </div>
          <div style={{ fontSize: 32, color: "rgba(15,23,42,0.65)" }}>
            {subtitle}
          </div>
        </div>
        <div
          style={{
            fontSize: 20,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(15,23,42,0.5)",
          }}
        >
          Interactive Atlas
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
      },
    }
  );
}
