import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { TransitionPanel } from "@/features/lectures/ui/transition-panel";
import { ShareBar } from "@/features/lectures/ui/share-bar";
import { transitionParamsSchema } from "@/features/lectures/schemas";
import { getAllTransitionParams, getTransition } from "@/features/lectures/lib/lectures";

export function generateStaticParams() {
  return getAllTransitionParams();
}

type PageParams = { volumeId: string; from: string; to: string };

export async function generateMetadata({
  params,
}: {
  params: PageParams;
}): Promise<Metadata> {
  const parsed = transitionParamsSchema.safeParse(params);
  if (!parsed.success) {
    return {};
  }

  const transition = getTransition(
    parsed.data.volumeId,
    parsed.data.from,
    parsed.data.to
  );

  if (!transition) {
    return {};
  }

  const title = `Transition · ${transition.from.title} → ${transition.to.title}`;
  const description = `Bridge the ideas between ${transition.from.title} and ${transition.to.title} in ${transition.volume.title}.`;
  const ogUrl = `/og?title=${encodeURIComponent(
    transition.from.title
  )}&subtitle=${encodeURIComponent(
    transition.to.title
  )}&meta=${encodeURIComponent(transition.volume.title)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      url: `/volume/${transition.volume.id}/transition/${transition.from.slug}/${transition.to.slug}`,
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

export default async function TransitionPage({
  params,
}: {
  params: PageParams | Promise<PageParams>;
}) {
  const resolvedParams = await params;
  const parsed = transitionParamsSchema.safeParse(resolvedParams);
  if (!parsed.success) {
    notFound();
  }

  const transition = getTransition(
    parsed.data.volumeId,
    parsed.data.from,
    parsed.data.to
  );

  if (!transition) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <section className="mx-auto flex max-w-5xl justify-end px-6 pt-10">
        <ShareBar label="Share transition" />
      </section>
      <TransitionPanel
        volume={transition.volume}
        from={transition.from}
        to={transition.to}
      />
    </main>
  );
}
