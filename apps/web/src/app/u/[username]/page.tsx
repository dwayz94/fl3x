import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { FullPublicProfile } from "@fl3x/shared";
import { PublicProfile } from "@/components/profile/PublicProfile";
import { site } from "@/config/site";

async function getProfile(username: string): Promise<FullPublicProfile | null> {
  const res = await fetch(`${site.apiUrl}/profiles/${encodeURIComponent(username)}`, { next: { revalidate: 30 } }).catch(() => null);
  return res?.ok ? ((await res.json()) as FullPublicProfile) : null;
}

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Not found" };
  const name = profile.displayName ?? profile.username;
  return {
    title: `${name} (@${profile.username})`,
    description: profile.bio ?? `${name} on FL3X`,
    alternates: { canonical: `/@${profile.username}` },
    openGraph: { images: profile.avatarUrl ? [profile.avatarUrl] : undefined },
  };
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();
  return <PublicProfile profile={profile} />;
}
