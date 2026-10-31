import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { FullPublicProfile } from "@fl3x/shared";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { site } from "@/config/site";

/**
 * null only when the profile really doesn't exist. Any other failure (API
 * down, deploy, timeout) throws, so a real profile never turns into a 404.
 * The internal key lets these server calls past the API's per-IP limit
 * (every render comes from Vercel's shared IPs).
 */
async function getProfile(username: string): Promise<FullPublicProfile | null> {
  const res = await fetch(`${site.apiUrl}/profiles/${encodeURIComponent(username)}`, {
    next: { revalidate: 30 },
    headers: process.env.INTERNAL_API_KEY ? { "x-internal-key": process.env.INTERNAL_API_KEY } : undefined,
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Profile API ${res.status}`);
  return (await res.json()) as FullPublicProfile;
}

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Page not found", robots: { index: false } };
  const name = profile.displayName ?? profile.username;
  return {
    title: `${name} (@${profile.username})`,
    description: profile.bio ?? `${name} on FL3X`,
    alternates: { canonical: `/@${profile.username}` },
    // Images come from opengraph-image.tsx / twitter-image.tsx (large card with the profile).
    openGraph: { title: `${name} on FL3X`, url: `/@${profile.username}` },
    twitter: { card: "summary_large_image", title: `${name} on FL3X` },
  };
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();
  const name = profile.displayName ?? profile.username;
  // Tells search engines this page is a person's profile (name, handle, avatar, their links).
  const url = `${site.url}/@${profile.username}`;
  const sameAs = [...new Set([...(profile.xHandle ? [`https://x.com/${profile.xHandle}`] : []), ...profile.links.map((l) => l.url)])];
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfilePage",
        url,
        name: `${name} (@${profile.username}) on FL3X`,
        isPartOf: { "@id": `${site.url}/#site` },
        mainEntity: {
          "@type": "Person",
          name,
          alternateName: `@${profile.username}`,
          identifier: profile.username,
          url,
          description: profile.bio ?? undefined,
          image: profile.avatarUrl ?? undefined,
          sameAs,
          interactionStatistic: { "@type": "InteractionCounter", interactionType: "https://schema.org/ViewAction", userInteractionCount: profile.views },
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "FL3X", item: site.url },
          { "@type": "ListItem", position: 2, name: "Explore", item: `${site.url}/explore` },
          { "@type": "ListItem", position: 3, name, item: url },
        ],
      },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <PublicProfile profile={profile} />
    </>
  );
}
