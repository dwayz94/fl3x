import { z } from "zod";
import type { Tier } from "./tiers";
import type { Widget } from "./widgets";

/**
 * Social links shown as icons under the profile. The member only types the
 * handle; the domain is fixed so a link always goes where its icon says.
 */
export const LINK_KINDS = [
  { id: "x", label: "X", prefix: "x.com/", handle: "[A-Za-z0-9_]{1,15}", placeholder: "yourhandle" },
  { id: "discord", label: "Discord", prefix: "discord.gg/", handle: "[A-Za-z0-9-]{2,32}", placeholder: "invite-code" },
  { id: "telegram", label: "Telegram", prefix: "t.me/", handle: "[A-Za-z0-9_]{4,32}", placeholder: "yourchannel" },
  // Trading terminals: referral links.
  { id: "axiom", label: "Axiom", prefix: "axiom.trade/@", handle: "[A-Za-z0-9_.-]{2,32}", placeholder: "yourcode" },
  { id: "gmgn", label: "GMGN", prefix: "gmgn.ai/r/", handle: "[A-Za-z0-9_-]{2,32}", placeholder: "yourcode" },
  { id: "padre", label: "Padre", prefix: "trade.padre.gg/rk/", handle: "[A-Za-z0-9_-]{2,32}", placeholder: "yourcode" },
  { id: "proxima", label: "Proxima", prefix: "proxima.tools/@", handle: "[A-Za-z0-9_.-]{2,32}", placeholder: "yourcode" },
  { id: "youtube", label: "YouTube", prefix: "youtube.com/@", handle: "[A-Za-z0-9._-]{3,30}", placeholder: "yourchannel" },
  { id: "twitch", label: "Twitch", prefix: "twitch.tv/", handle: "[A-Za-z0-9_]{3,25}", placeholder: "yourchannel" },
  { id: "tiktok", label: "TikTok", prefix: "tiktok.com/@", handle: "[A-Za-z0-9._]{2,24}", placeholder: "yourhandle" },
  { id: "instagram", label: "Instagram", prefix: "instagram.com/", handle: "[A-Za-z0-9._]{1,30}", placeholder: "yourhandle" },
  { id: "github", label: "GitHub", prefix: "github.com/", handle: "[A-Za-z0-9-]{1,39}", placeholder: "yourname" },
  { id: "spotify", label: "Spotify", prefix: "open.spotify.com/", handle: "(artist|user|playlist|album)/[A-Za-z0-9]{1,40}", placeholder: "artist/0TnOYISbd1XYRBk9myaseg" },
  { id: "website", label: "Website", prefix: "", handle: "[A-Za-z0-9.-]+\\.[A-Za-z]{2,}(/[^\\s]*)?", placeholder: "yoursite.com" },
  { id: "custom", label: "Custom", prefix: "", handle: "[A-Za-z0-9.-]+\\.[A-Za-z]{2,}(/[^\\s]*)?", placeholder: "link.com/page" },
] as const;

const linkKind = (kind: string) => LINK_KINDS.find((l) => l.id === kind);

/** Handle → full https link. */
export function buildLinkUrl(kind: string, handle: string) {
  return `https://${linkKind(kind)?.prefix ?? ""}${handle.trim().replace(/^@/, "")}`;
}

/** Accepts a bare handle or a pasted full link and returns the handle part. */
export function handleFromInput(kind: string, input: string) {
  const prefix = linkKind(kind)?.prefix ?? "";
  let v = input.trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
  if (prefix && v.toLowerCase().startsWith(prefix.toLowerCase())) v = v.slice(prefix.length);
  if (prefix.endsWith("@") || kind === "x" || kind === "tiktok") v = v.replace(/^@/, "");
  return v.replace(/\/$/, "");
}

export function isValidLinkHandle(kind: string, handle: string) {
  const k = linkKind(kind);
  return Boolean(k && new RegExp(`^(?:${k.handle})$`).test(handle));
}

export type LinkKind = (typeof LINK_KINDS)[number]["id"];

export interface ProfileLink {
  id: string;
  kind: LinkKind;
  url: string;
  label: string | null;
}

export const FONTS = [
  { id: "moga", label: "Moga" },
  { id: "outfit", label: "Outfit" },
  { id: "mono", label: "Mono" },
  { id: "serif", label: "Serif" },
] as const;

export const CURSORS = [
  { id: "default", label: "System" },
  { id: "classic", label: "Classic" },
  { id: "midnight", label: "Midnight" },
  { id: "pixel", label: "8-bit" },
  { id: "solana", label: "Solana" },
  { id: "gold", label: "Gold" },
  { id: "glitch", label: "Glitch" },
  { id: "neon", label: "Neon" },
  { id: "diamond", label: "Diamond" },
  { id: "rocket", label: "Rocket" },
  { id: "flame", label: "Flame" },
  { id: "laser", label: "Laser" },
  { id: "scope", label: "Scope" },
] as const;

/** Cursors from the first version, mapped to their closest new design. */
const LEGACY_CURSORS: Record<string, (typeof CURSORS)[number]["id"]> = { arrow: "classic", dot: "laser", ring: "scope", crosshair: "scope", coin: "gold", heart: "default", star: "default", sparkle: "default" };
export function normalizeCursor(id: string | undefined): (typeof CURSORS)[number]["id"] {
  if (CURSORS.some((c) => c.id === id)) return id as (typeof CURSORS)[number]["id"];
  return LEGACY_CURSORS[id ?? ""] ?? "default";
}

export const BACKGROUNDS = [
  { id: "plain", label: "Plain" },
  { id: "pink", label: "Pink glow" },
  { id: "violet", label: "Violet" },
  { id: "red", label: "Red" },
  { id: "gold", label: "Gold" },
  { id: "teal", label: "Teal" },
  { id: "image", label: "Image" },
] as const;

export interface ProfileTheme {
  accent: string;
  background: (typeof BACKGROUNDS)[number]["id"];
  backgroundUrl?: string;
  font: (typeof FONTS)[number]["id"];
  cursor: (typeof CURSORS)[number]["id"];
  /** The small FL3X mark under the card. Premium can hide it. */
  branding?: boolean;
}

export const DEFAULT_THEME: ProfileTheme = { accent: "#FF97CB", background: "plain", font: "moga", cursor: "default", branding: true };

/** Premium-only customizations. Others keep the defaults for these keys; the background image is open to everyone. */
export const PREMIUM_THEME_KEYS = ["font", "cursor", "branding"] as const;

/** analyticsDays: how far back the analytics dashboard goes. */
export const TIER_LIMITS: Record<Tier, { widgets: number; links: number; analyticsDays: number }> = {
  none: { widgets: 2, links: 3, analyticsDays: 7 },
  starter: { widgets: 4, links: 4, analyticsDays: 30 },
  premium: { widgets: 12, links: 8, analyticsDays: 90 },
};

/**
 * What each tier gets, shown on the landing and the Premium page. Only list
 * what the product really does: every line here must exist in the code.
 */
export const TIER_PERKS: Record<Tier, string[]> = {
  none: [
    `Your profile at fl3x.lol/@you`,
    `${TIER_LIMITS.none.widgets} live widgets and ${TIER_LIMITS.none.links} links`,
    "Wallets, tokens, music, videos, communities",
    "Colors, backgrounds and your own images",
    "Badges and referral link",
    `Analytics for the last ${TIER_LIMITS.none.analyticsDays} days`,
  ],
  starter: [
    "Everything in Free",
    `${TIER_LIMITS.starter.widgets} widgets and ${TIER_LIMITS.starter.links} links`,
    `Analytics for the last ${TIER_LIMITS.starter.analyticsDays} days`,
  ],
  premium: [
    "Everything in Starter",
    "Premium checkmark next to your name",
    `${TIER_LIMITS.premium.widgets} widgets and ${TIER_LIMITS.premium.links} links`,
    "Custom fonts and cursors",
    "Remove the FL3X mark from your profile",
    `Analytics for the last ${TIER_LIMITS.premium.analyticsDays} days`,
    "Premium badge",
  ],
};

/**
 * Image fields: https URLs (uploads are served by the API), our own
 * /images/... assets, and plain http only for local dev hosts.
 */
export const imageUrl = z.union([
  z.url({ protocol: /^https$/ }).max(500),
  z.url({ protocol: /^http$/, hostname: /^(localhost|127\.0\.0\.1)$/ }).max(500),
  z.string().regex(/^\/images\/[\w\-/.]+$/).max(200),
]);

export const themeInput = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.enum(BACKGROUNDS.map((b) => b.id) as [string, ...string[]]),
  backgroundUrl: z.union([imageUrl, z.literal("")]).optional(),
  font: z.enum(FONTS.map((f) => f.id) as [string, ...string[]]),
  cursor: z.enum(CURSORS.map((c) => c.id) as [string, ...string[]]),
  branding: z.boolean().optional(),
});

export const profileInput = z.object({
  displayName: z.string().trim().max(32).nullable(),
  bio: z.string().trim().max(160).nullable(),
  avatarUrl: z.union([imageUrl, z.literal("")]).nullable(),
  badges: z.array(z.string().max(32)).max(24),
  theme: themeInput,
});

/** Name, bio and avatar alone (Settings, or clicking the avatar in Customize). */
export const identityInput = profileInput.pick({ displayName: true, bio: true, avatarUrl: true }).partial();

export const linksInput = z
  .array(
    z.object({
      id: z.string().uuid().optional(),
      kind: z.enum(LINK_KINDS.map((l) => l.id) as [LinkKind, ...LinkKind[]]),
      url: z.url({ protocol: /^https$/ }).max(500),
      label: z.string().trim().max(40).nullable().optional(),
    }),
  )
  .max(40)
  .superRefine((links, ctx) => {
    links.forEach((l, i) => {
      // The stored URL must be exactly prefix + a valid handle.
      if (!isValidLinkHandle(l.kind, handleFromInput(l.kind, l.url)) || buildLinkUrl(l.kind, handleFromInput(l.kind, l.url)) !== l.url) {
        ctx.addIssue({ code: "custom", path: [i, "url"], message: `Invalid ${linkKind(l.kind)?.label ?? "link"} handle` });
      }
    });
  });

export interface EditableProfile {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  badges: string[];
  theme: ProfileTheme;
  widgets: Widget[];
  links: ProfileLink[];
}

export interface FullPublicProfile extends EditableProfile {
  tier: Tier;
  badgeStats?: { memberNumber: number | null; referrals: number };
  xHandle: string | null;
  views: number;
}
