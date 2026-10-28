import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckmarkBadge01Icon } from "@hugeicons/core-free-icons";
import type { PublicProfile } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { site } from "@/config/site";

async function getProfile(username: string): Promise<PublicProfile | null> {
  const res = await fetch(`${site.apiUrl}/profiles/${encodeURIComponent(username)}`, { next: { revalidate: 30 } }).catch(() => null);
  return res?.ok ? ((await res.json()) as PublicProfile) : null;
}

type Props = { params: Promise<{ username: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const profile = await getProfile((await params).username);
  if (!profile) return { title: "Not found" };
  return { title: `@${profile.username}`, description: profile.bio ?? `${profile.displayName ?? profile.username} on FL3X` };
}

export default async function ProfilePage({ params }: Props) {
  const profile = await getProfile((await params).username);
  if (!profile) notFound();

  return (
    <main className="flex min-h-svh flex-col items-center px-4 py-16">
      <div className="flex w-full max-w-md flex-col items-center gap-4 text-center">
        <div className="relative size-28 overflow-hidden rounded-[32px] bg-surface">
          {profile.avatarUrl && <Image src={profile.avatarUrl} alt="" fill sizes="112px" className="object-cover" unoptimized />}
        </div>
        <h1 className="flex items-center gap-2 text-5xl">
          {profile.displayName ?? profile.username}
          {profile.tier !== "none" && (
            <Icon
              icon={CheckmarkBadge01Icon}
              size={28}
              className={profile.tier === "premium" ? "text-brand drop-shadow-[0_0_20px_rgba(255,151,203,0.6)]" : "text-verified"}
            />
          )}
        </h1>
        <p className="text-fg-2">@{profile.username}</p>
        {profile.bio && <p>{profile.bio}</p>}
        {profile.xHandle && (
          <a href={`https://x.com/${profile.xHandle}`} target="_blank" rel="noopener noreferrer" className="text-fg-2 hover:text-fg">
            x.com/{profile.xHandle}
          </a>
        )}
      </div>
      <Link href="/" className="mt-auto pt-16 opacity-60 transition-opacity hover:opacity-100">
        <Image src="/images/fl3x-logo.svg" alt="FL3X" width={64} height={22} />
      </Link>
    </main>
  );
}
