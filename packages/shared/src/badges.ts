import type { Tier } from "./tiers";

/**
 * Badge catalogue (Figma node 286:819). Icons live in the web app at
 * /images/badges/<id>.svg. `unlock` decides who owns a badge; ownership is
 * computed by the API, never trusted from the client.
 */
export type BadgeUnlock =
  | { kind: "tier"; tier: Exclude<Tier, "none"> }
  | { kind: "early" }                       // joined during the invite-only pre-launch
  | { kind: "rank"; max: number }           // among the first N members
  | { kind: "referrals"; count: number }
  | { kind: "whale" }                       // holds 10× the Premium threshold
  | { kind: "staff" }
  | { kind: "granted" };                    // handed out by the team (admin API)

export interface BadgeDef {
  id: string;
  name: string;
  /** Text color from the Figma, also baked into the icon. */
  color: string;
  /** How to earn it, shown in the badge tooltip. */
  description: string;
  unlock: BadgeUnlock;
}

export const BADGES: readonly BadgeDef[] = [
  { id: "founder", name: "Founder", color: "#FF97CB", description: "Part of the team building FL3X.", unlock: { kind: "staff" } },
  { id: "premium", name: "Premium", color: "#FF97CB", description: "Holds enough $FL3X for the Premium tier.", unlock: { kind: "tier", tier: "premium" } },
  { id: "og", name: "OG", color: "#FFFFFF", description: "One of the first 100 members.", unlock: { kind: "rank", max: 100 } },
  { id: "early-adopter", name: "Early Adopter", color: "#F6FF7C", description: "Joined during the invite-only pre-launch.", unlock: { kind: "early" } },
  { id: "whale", name: "Whale", color: "#008CFF", description: "Holds 10× the Premium amount of $FL3X.", unlock: { kind: "whale" } },
  { id: "contributor", name: "Contributor", color: "#F87BFF", description: "Brought 3 people to FL3X with their invite link.", unlock: { kind: "referrals", count: 3 } },
  // Referral rewards: each milestone unlocks the next badge (shown on the Referral page).
  { id: "recruiter", name: "Recruiter", color: "#6FA8FF", description: "Brought 10 people to FL3X with their invite link.", unlock: { kind: "referrals", count: 10 } },
  { id: "ambassador", name: "Ambassador", color: "#FF9E7A", description: "Brought 25 people to FL3X with their invite link.", unlock: { kind: "referrals", count: 25 } },
  { id: "legend", name: "Legend", color: "#FFE45C", description: "Brought 50 people to FL3X with their invite link.", unlock: { kind: "referrals", count: 50 } },
  { id: "kol", name: "Kol", color: "#FFD268", description: "Key opinion leader, recognized by the team.", unlock: { kind: "granted" } },
  { id: "creator", name: "Creator", color: "#C274FF", description: "Content creator, recognized by the team.", unlock: { kind: "granted" } },
  { id: "builder", name: "Builder", color: "#93FFFA", description: "Ships products in the ecosystem.", unlock: { kind: "granted" } },
  { id: "donor", name: "Donor", color: "#2FE3AC", description: "Supported FL3X with a donation.", unlock: { kind: "granted" } },
  { id: "gifter", name: "Gifter", color: "#FF8132", description: "Gifted Premium to another member.", unlock: { kind: "granted" } },
  { id: "gas-spender", name: "Gas Spender", color: "#FF4379", description: "Burns gas like there's no tomorrow.", unlock: { kind: "granted" } },
  { id: "bug-hunter", name: "Bug Hunter", color: "#C7FF78", description: "Reported a real bug to the team.", unlock: { kind: "granted" } },
];

export const BADGE_IDS = BADGES.map((b) => b.id);

export interface BadgeFacts {
  tier: Tier;
  early: boolean;
  /** 1-based onboarding order, null before claiming a username. */
  memberNumber: number | null;
  referrals: number;
  tokenBalance: number;
  premiumMin: number;
  staff: boolean;
  granted: readonly string[];
}

export function ownedBadges(f: BadgeFacts): string[] {
  return BADGES.filter(({ id, unlock: u }) => {
    switch (u.kind) {
      case "tier": return f.tier === u.tier;
      case "early": return f.early;
      case "rank": return f.memberNumber != null && f.memberNumber <= u.max;
      case "referrals": return f.referrals >= u.count;
      case "whale": return f.premiumMin > 0 && f.tokenBalance >= f.premiumMin * 10;
      case "staff": return f.staff;
      case "granted": return f.granted.includes(id);
    }
  }).map((b) => b.id);
}

/** Counter shown in the tooltip, e.g. "Member #42" or "2/3 invites". */
export function badgeDetail(b: BadgeDef, stats: { memberNumber: number | null; referrals: number }): string | null {
  switch (b.unlock.kind) {
    case "rank":
      return stats.memberNumber ? `Member #${stats.memberNumber}` : null;
    case "referrals":
      return `${stats.referrals} ${stats.referrals === 1 ? "invite" : "invites"}`;
    default:
      return null;
  }
}

/** Referral milestones, smallest first: the rewards shown on the Referral page. */
export const REFERRAL_REWARDS = BADGES.flatMap((b) => (b.unlock.kind === "referrals" ? [{ badge: b, count: b.unlock.count }] : [])).sort((a, b) => a.count - b.count);
