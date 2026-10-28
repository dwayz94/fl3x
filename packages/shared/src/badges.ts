import type { Tier } from "./tiers";

/**
 * Badge catalogue. `unlock` decides who owns a badge; ownership is
 * computed by the API, never trusted from the client.
 */
export type BadgeUnlock =
  | { kind: "tier"; tier: Exclude<Tier, "none"> }
  | { kind: "early" }       // joined during invite-only
  | { kind: "referrals"; count: number }
  | { kind: "x" }           // linked an X account
  | { kind: "staff" };

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  emoji: string;
  unlock: BadgeUnlock;
}

export const BADGES: readonly BadgeDef[] = [
  { id: "og", name: "OG", description: "Joined FL3X during the invite-only pre-launch.", emoji: "🗝️", unlock: { kind: "early" } },
  { id: "starter", name: "Holder", description: "Holds enough token for the Starter tier.", emoji: "💎", unlock: { kind: "tier", tier: "starter" } },
  { id: "premium", name: "Premium", description: "Holds enough token for the Premium tier.", emoji: "👑", unlock: { kind: "tier", tier: "premium" } },
  { id: "verified-x", name: "Verified X", description: "Linked an X account to the profile.", emoji: "✖️", unlock: { kind: "x" } },
  { id: "recruiter", name: "Recruiter", description: "Brought 3 people to FL3X.", emoji: "🤝", unlock: { kind: "referrals", count: 3 } },
  { id: "ambassador", name: "Ambassador", description: "Brought 10 people to FL3X.", emoji: "📣", unlock: { kind: "referrals", count: 10 } },
  { id: "whale-hunter", name: "Whale Hunter", description: "Brought 50 people to FL3X.", emoji: "🐋", unlock: { kind: "referrals", count: 50 } },
  { id: "staff", name: "Staff", description: "Part of the FL3X team.", emoji: "⚡", unlock: { kind: "staff" } },
];

export function ownedBadges(u: { tier: Tier; early: boolean; referrals: number; hasX: boolean; staff: boolean }): string[] {
  return BADGES.filter(({ unlock: x }) => {
    switch (x.kind) {
      case "tier": return u.tier === "premium" || (x.tier === "starter" && u.tier === "starter");
      case "early": return u.early;
      case "referrals": return u.referrals >= x.count;
      case "x": return u.hasX;
      case "staff": return u.staff;
    }
  }).map((b) => b.id);
}
