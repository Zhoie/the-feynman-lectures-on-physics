import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { volumes } from "@/features/lectures/data";
import { VolumeHero } from "@/features/lectures/ui/volume-hero";
import { VolumeNav } from "@/features/lectures/ui/volume-nav";
import { VolumeBrowser } from "@/features/lectures/ui/volume-search";
import { volumeIdSchema } from "@/features/lectures/schemas";
import { getVolumeById, getVolumeNavigation } from "@/features/lectures/lib/lectures";

export function generateStaticParams() {
  return volumes.map((volume) => ({ volumeId: volume.id }));
}

export const dynamicParams = false;

type PageParams = { volumeId: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<PageParams>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const parsed = volumeIdSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    return {};
  }

  const volume = getVolumeById(parsed.data.volumeId);
  if (!volume) {
    return {};
  }

  const title = `${volume.title} · ${volume.subtitle}`;
  const description = volume.summary;
  const ogTitle = encodeURIComponent(volume.subtitle);
  const ogMeta = encodeURIComponent(volume.title);
  const ogUrl = `/og?title=${ogTitle}&subtitle=${encodeURIComponent(
    "Volume Overview"
  )}&meta=${ogMeta}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/volume/${volume.id}`,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: `/volume/${volume.id}`,
      images: [{ url: ogUrl }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function VolumePage({
  params,
}: {
  params: Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const parsed = volumeIdSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    notFound();
  }

  const volume = getVolumeById(parsed.data.volumeId);
  if (!volume) {
    notFound();
  }

  const navigation = getVolumeNavigation(volume.id);

  return (
    <main id="main-content" className="min-h-screen">
      <VolumeHero volume={volume} />
      <VolumeBrowser
        volumeId={volume.id}
        chapters={volume.chapters}
        accent={volume.accent}
      />
      <VolumeNav
        previous={navigation?.previous ?? null}
        next={navigation?.next ?? null}
      />
    </main>
  );
}
