"use client";

import type { FullPublicProfile } from "@fl3x/shared";
import { ProfileView } from "@/components/profile/ProfileView";
import { DEMO_TRACK_URL, demoProfile, demoWidget, resolveDemo } from "@/lib/demo";
import { DemoDataProvider } from "@/lib/use-data";

/** What a claimed profile looks like: "You", a few badges, four live widgets and a real song. */
const PROFILE: FullPublicProfile = {
  ...demoProfile([
    demoWidget("pnl", "large", { period: "1m" }, "hero-pnl"),
    demoWidget("music", "large", { source: "link", url: DEMO_TRACK_URL }, "hero-music"),
    demoWidget("community", "long", { platform: "discord", invite: "fl3x" }, "hero-discord"),
    demoWidget("portfolio", "long", { period: "7d" }, "hero-portfolio"),
  ]),
  username: "you",
  displayName: "You",
  bio: "Flex on all screens",
  badges: ["premium", "og", "early-adopter", "whale"],
  views: 12_480,
};

export function HeroPreview({ username }: { username?: string }) {
  const profile = username ? { ...PROFILE, username, displayName: username } : PROFILE;
  return (
    <DemoDataProvider resolve={resolveDemo}>
      <div className="pointer-events-none select-none [&_a]:pointer-events-none" aria-hidden>
        <ProfileView profile={profile} tier="premium" views={profile.views} />
      </div>
    </DemoDataProvider>
  );
}
