import type { Metadata } from "next";
import { getSiteUrl } from "@/core/config/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: "The Feynman Lectures on Physics",
    template: "%s · The Feynman Lectures on Physics",
  },
  description:
    "Interactive volume and chapter atlas inspired by The Feynman Lectures on Physics.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "The Feynman Lectures on Physics",
    description:
      "Interactive volume and chapter atlas inspired by The Feynman Lectures on Physics.",
    type: "website",
    images: [
      {
        url: "/og?title=The%20Feynman%20Lectures%20on%20Physics&subtitle=Interactive%20Atlas&meta=Volumes%20and%20Chapters",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The Feynman Lectures on Physics",
    description:
      "Interactive volume and chapter atlas inspired by The Feynman Lectures on Physics.",
    images: [
      "/og?title=The%20Feynman%20Lectures%20on%20Physics&subtitle=Interactive%20Atlas&meta=Volumes%20and%20Chapters",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only rounded-full border border-slate-900/10 bg-white/95 px-4 py-2 text-sm font-medium text-slate-900 shadow-sm focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:outline-none focus:ring-2 focus:ring-slate-900/15 focus:ring-offset-2 focus:ring-offset-[var(--paper)]"
        >
          Skip to content
        </a>
        <div className="site-backdrop fixed inset-0 -z-10" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
