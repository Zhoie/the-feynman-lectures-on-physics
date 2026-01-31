import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  IBM_Plex_Mono,
  Space_Grotesk,
} from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-display",
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "The Feynman Lectures on Physics",
    template: "%s · The Feynman Lectures on Physics",
  },
  description:
    "Interactive volume and chapter atlas inspired by The Feynman Lectures on Physics.",
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
      <body className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <div className="fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-[#f7f2ea]" />
          <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.18),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(14,165,233,0.18),transparent_40%),radial-gradient(circle_at_70%_80%,rgba(16,185,129,0.18),transparent_45%)]" />
          <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(15,23,42,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.08)_1px,transparent_1px)] [background-size:56px_56px]" />
          <div className="absolute -left-32 top-16 h-64 w-64 rounded-full bg-gradient-to-br from-amber-300/50 via-amber-200/10 to-transparent blur-3xl" />
          <div className="absolute right-0 top-24 h-72 w-72 rounded-full bg-gradient-to-tr from-sky-300/45 via-sky-200/10 to-transparent blur-3xl" />
          <div className="absolute bottom-10 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-gradient-to-tr from-emerald-300/40 via-emerald-100/5 to-transparent blur-3xl" />
        </div>
        {children}
      </body>
    </html>
  );
}
