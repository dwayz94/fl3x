import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { normalizeUsername, type FullPublicProfile } from "@fl3x/shared";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { MissingProfile } from "@/components/shared";
import { site } from "@/config/site";
import { shareMetadata } from "@/lib/seo";

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

/** Whether a missing profile's name can still be claimed (same answer as the join flow's check). */
async function getAvailability(username: string): Promise<{ available: boolean; reason: string | null }> {
  try {
    const res = await fetch(`${site.apiUrl}/usernames/${encodeURIComponent(username)}`, { next: { revalidate: 30 } });
    if (res.ok) return await res.json();
  } catch {}
  return { available: false, reason: "Can't check this name right now. Try again in a moment." };
}

/** fl3x.lol/@you is the placeholder in our posts: people who tap it want to join (members land on their dashboard from there). */
const JOIN_HANDLES = new Set(["you", "yourname"]);

function handleOf(raw: string) {
  try {
    return normalizeUsername(decodeURIComponent(raw));
  } catch {
    return normalizeUsername(raw);
  }
}

type Props = { params: Promise<{ username: string }> };

/**
 * Rendered once, then served from Vercel's cache and refreshed every 30 s
 * (the same rhythm as the profile fetch): no server work per visit. Live
 * widget values load in the browser.
 */
export const revalidate = 30;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const username = handleOf((await params).username);
  if (JOIN_HANDLES.has(username)) return { title: "Claim your name", robots: { index: false } };
  const profile = await getProfile(username);
  if (!profile) return { title: `@${username}`, description: `fl3x.lol/@${username} on FL3X`, robots: { index: false } };
  const name = profile.displayName ?? profile.username;
  return {
    title: `${name} (@${profile.username})`,
    description: profile.bio ?? `${name} on FL3X`,
    alternates: { canonical: `/@${profile.username}` },
    // Images come from opengraph-image.tsx / twitter-image.tsx (large card with the profile).
    ...shareMetadata({ url: `/@${profile.username}`, title: `${name} on FL3X`, description: profile.bio ?? `${name} on FL3X`, ownImages: true }),
  };
}

export default async function ProfilePage({ params }: Props) {
  const username = handleOf((await params).username);
  if (JOIN_HANDLES.has(username)) redirect("/join");
  const profile = await getProfile(username);
  if (!profile) return <MissingProfile handle={username} {...await getAvailability(username)} />;
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
