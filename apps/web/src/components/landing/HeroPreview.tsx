"use client";

import type { FullPublicProfile } from "@fl3x/shared";
import { ProfileView } from "@/components/profile/ProfileView";
import { site } from "@/config/site";
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
  // The FL3X bag instead of a stock face: it's "you", not someone else.
  avatarUrl: "/brand/fl3x-app-icon.svg",
  badges: ["premium", "og", "early-adopter", "whale"],
  views: 12_480,
  // Links go to FL3X's real accounts.
  links: [
    { id: "h-x", kind: "x", url: site.social.x, label: null },
    { id: "h-dc", kind: "discord", url: site.social.discord, label: null },
  ],
};

/**
 * Tilted like a card on a table (perspective, not flat), and live: badges,
 * links and the play button work. It straightens a little on hover.
 */
export function HeroPreview({ username }: { username?: string }) {
  const profile = username ? { ...PROFILE, username, displayName: username } : PROFILE;
  return (
    <DemoDataProvider resolve={resolveDemo}>
      <div className="[perspective:2200px]">
        <div className="origin-left transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] [transform:rotateY(-18deg)_rotateX(8deg)_rotateZ(-4deg)] [transform-style:preserve-3d] hover:[transform:rotateY(-10deg)_rotateX(4deg)_rotateZ(-2deg)]">
          <ProfileView profile={profile} tier="premium" views={profile.views} />
        </div>
      </div>
    </DemoDataProvider>
  );
}
