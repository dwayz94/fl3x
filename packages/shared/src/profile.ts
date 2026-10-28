import { z } from "zod";
import type { Tier } from "./tiers";
import type { Widget } from "./widgets";

/** Social links shown as icons under the profile. */
export const LINK_KINDS = [
  { id: "x", label: "X", prefix: "https://x.com/" },
  { id: "discord", label: "Discord", prefix: "https://discord.gg/" },
  { id: "telegram", label: "Telegram", prefix: "https://t.me/" },
  { id: "youtube", label: "YouTube", prefix: "https://youtube.com/@" },
  { id: "twitch", label: "Twitch", prefix: "https://twitch.tv/" },
  { id: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@" },
  { id: "instagram", label: "Instagram", prefix: "https://instagram.com/" },
  { id: "github", label: "GitHub", prefix: "https://github.com/" },
  { id: "spotify", label: "Spotify", prefix: "https://open.spotify.com/" },
  { id: "website", label: "Website", prefix: "https://" },
  { id: "custom", label: "Custom", prefix: "https://" },
] as const;
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
  { id: "default", label: "Default" },
  { id: "dot", label: "Dot" },
  { id: "crosshair", label: "Crosshair" },
  { id: "arrow", label: "Pink arrow" },
] as const;

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
}

export const DEFAULT_THEME: ProfileTheme = { accent: "#FF97CB", background: "plain", font: "moga", cursor: "default" };

/** Premium-only customizations. Others keep the defaults for these keys; the background image is open to everyone. */
export const PREMIUM_THEME_KEYS = ["font", "cursor"] as const;

export const TIER_LIMITS: Record<Tier, { widgets: number; links: number }> = {
  none: { widgets: 4, links: 6 },
  starter: { widgets: 8, links: 12 },
  premium: { widgets: 60, links: 40 },
};

export const themeInput = z.object({
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  background: z.enum(BACKGROUNDS.map((b) => b.id) as [string, ...string[]]),
  backgroundUrl: z.union([z.url({ protocol: /^https$/ }).max(500), z.literal("")]).optional(),
  font: z.enum(FONTS.map((f) => f.id) as [string, ...string[]]),
  cursor: z.enum(CURSORS.map((c) => c.id) as [string, ...string[]]),
});

export const profileInput = z.object({
  displayName: z.string().trim().max(32).nullable(),
  bio: z.string().trim().max(160).nullable(),
  avatarUrl: z.union([z.url({ protocol: /^https$/ }).max(500), z.literal("")]).nullable(),
  badges: z.array(z.string().max(32)).max(24),
  theme: themeInput,
});

export const linksInput = z
  .array(
    z.object({
      id: z.string().uuid().optional(),
      kind: z.enum(LINK_KINDS.map((l) => l.id) as [LinkKind, ...LinkKind[]]),
      url: z.url({ protocol: /^https?$/ }).max(500),
      label: z.string().trim().max(40).nullable().optional(),
    }),
  )
  .max(40);

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
  xHandle: string | null;
  views: number;
}
