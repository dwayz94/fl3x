import { z } from "zod";
import { imageUrl } from "./profile";

/**
 * Widget catalogue. Field definitions drive both the dashboard inspector
 * (one input per field) and API validation (zod schema built from them),
 * so adding a widget only means adding an entry here and a renderer.
 */
export const WIDGET_SIZES = ["large", "long"] as const;
export type WidgetSize = (typeof WIDGET_SIZES)[number];

export const CHAINS = [
  { id: "solana", label: "Solana" },
  { id: "ethereum", label: "Ethereum" },
  { id: "base", label: "Base" },
  { id: "bsc", label: "BNB Chain" },
  { id: "arbitrum", label: "Arbitrum" },
  { id: "robinhood", label: "Robinhood Chain" },
] as const;
export type ChainId = (typeof CHAINS)[number]["id"];

export const PERIODS = [
  { id: "1d", label: "1d", days: 1 },
  { id: "7d", label: "7d", days: 7 },
  { id: "14d", label: "14d", days: 14 },
  { id: "1m", label: "1m", days: 30 },
  { id: "1y", label: "1y", days: 365 },
] as const;
export type PeriodId = (typeof PERIODS)[number]["id"];

type Opt = { id: string; label: string };

export type FieldDef =
  | { key: string; label: string; kind: "text" | "url" | "textarea"; placeholder?: string; max?: number; required?: boolean }
  /**
   * A handle typed after a fixed domain, picked by the `from` field
   * (e.g. platform "discord" → discord.gg/). Keeps links on the right site.
   */
  | { key: string; label: string; kind: "handle"; from: string; prefixes: Record<string, string>; pattern: string; required?: boolean }
  /** Uploaded image (or a link to one). */
  | { key: string; label: string; kind: "image"; required?: boolean }
  | { key: string; label: string; kind: "number"; min?: number; max?: number }
  | { key: string; label: string; kind: "select" | "segmented"; options: readonly Opt[]; default: string }
  /** "all" (every verified wallet, the default) or a comma-separated list of addresses. */
  | { key: string; label: string; kind: "wallets"; default: string }
  | { key: string; label: string; kind: "datetime"; required?: boolean }
  | { key: string; label: string; kind: "timezone" }
  | { key: string; label: string; kind: "color"; default: string }
  | { key: string; label: string; kind: "range"; min: number; max: number; default: number };

export interface WidgetDef {
  name: string;
  description: string;
  category: "crypto" | "social" | "media" | "utility";
  fields: readonly FieldDef[];
  /** Kept working for existing profiles but no longer offered in the library. */
  hidden?: boolean;
}

const wallets: FieldDef = { key: "wallets", label: "Wallets", kind: "wallets", default: "all" };
const accent: FieldDef = { key: "accent", label: "Color", kind: "color", default: "#2FE3AC" };
/** Design version. V2 is the default (kept on 2026-10-29); V1 stays available for whoever prefers it. */
/** Media widgets: blurred cover colors behind (default), plain glass, or a color. */
const background: FieldDef = {
  key: "background", label: "Background", kind: "segmented", default: "cover",
  options: [{ id: "cover", label: "Cover colors" }, { id: "glass", label: "Glass" }, { id: "color", label: "Color" }],
};
const tint: FieldDef = { key: "tint", label: "Color", kind: "color", default: "#7B5CFF" };
const opacity: FieldDef = { key: "bgOpacity", label: "Background opacity", kind: "range", min: 20, max: 100, default: 100 };

export const WIDGETS = {
  pnl: {
    name: "P&L Card",
    description: "Profit and loss of a verified wallet over a period",
    category: "crypto",
    fields: [
      wallets,
      { key: "period", label: "Time", kind: "segmented", options: PERIODS, default: "1m" },
      accent,
      opacity,
    ],
  },
  portfolio: {
    name: "Portfolio",
    description: "Live value of a verified wallet with a chart",
    category: "crypto",
    fields: [
      wallets,
      { key: "period", label: "Time", kind: "segmented", options: PERIODS, default: "7d" },
      opacity,
    ],
  },
  holdings: {
    name: "Holdings",
    description: "Wallet value and its biggest bags",
    category: "crypto",
    fields: [wallets, opacity],
  },
  nfts: {
    name: "NFT Gallery",
    description: "NFTs from your verified Solana wallets",
    category: "crypto",
    fields: [wallets, opacity],
  },
  token: {
    name: "Token",
    description: "Shill a token with live market cap",
    category: "crypto",
    fields: [
      { key: "chain", label: "Chain", kind: "select", options: CHAINS, default: "solana" },
      { key: "address", label: "Token address", kind: "text", placeholder: "Mint / contract address", max: 64, required: true },
      { key: "note", label: "Your take", kind: "textarea", placeholder: "Why you like it", max: 140 },
      opacity,
    ],
  },
  community: {
    name: "Community",
    description: "Discord or Telegram with live member count",
    category: "social",
    fields: [
      { key: "platform", label: "Platform", kind: "segmented", options: [{ id: "discord", label: "Discord" }, { id: "telegram", label: "Telegram" }], default: "discord" },
      { key: "invite", label: "Invite", kind: "handle", from: "platform", prefixes: { discord: "discord.gg/", telegram: "t.me/" }, pattern: "[A-Za-z0-9_-]{2,32}", required: true },
      opacity,
    ],
  },
  followers: {
    name: "Followers",
    description: "Show off your follower count",
    category: "social",
    fields: [
      // The count is read live from the platform (no typed numbers: no fake data). Instagram has no free source.
      { key: "platform", label: "Platform", kind: "select", options: [{ id: "x", label: "X" }, { id: "youtube", label: "YouTube" }, { id: "twitch", label: "Twitch" }, { id: "tiktok", label: "TikTok" }], default: "x" },
      {
        key: "handle", label: "Handle", kind: "handle", from: "platform", pattern: "[A-Za-z0-9._-]{1,30}", required: true,
        prefixes: { x: "x.com/", youtube: "youtube.com/@", twitch: "twitch.tv/", tiktok: "tiktok.com/@" },
      },
      opacity,
    ],
  },
  video: {
    name: "Video",
    description: "Your latest YouTube video or Twitch stream, automatically",
    category: "media",
    fields: [
      { key: "platform", label: "Platform", kind: "segmented", options: [{ id: "youtube", label: "YouTube" }, { id: "twitch", label: "Twitch" }], default: "youtube" },
      { key: "channel", label: "Channel", kind: "handle", from: "platform", prefixes: { youtube: "youtube.com/@", twitch: "twitch.tv/" }, pattern: "[A-Za-z0-9._-]{2,30}" },
      { key: "url", label: "Pin one video instead (optional)", kind: "url", placeholder: "https://youtube.com/watch?v=…" },
      background,
      tint,
    ],
  },
  music: {
    name: "Music",
    description: "What you're listening to on Spotify, or a track you pick",
    category: "media",
    fields: [
      { key: "source", label: "Show", kind: "segmented", options: [{ id: "spotify", label: "My Spotify (live)" }, { id: "link", label: "A track or playlist" }], default: "spotify" },
      { key: "url", label: "Spotify link (when showing a track)", kind: "url", placeholder: "https://open.spotify.com/track/…" },
      background,
      tint,
    ],
  },
  image: {
    name: "Image",
    description: "A picture or GIF",
    category: "media",
    fields: [
      { key: "url", label: "Image", kind: "image", required: true },
      { key: "caption", label: "Caption", kind: "text", max: 60 },
    ],
  },
  clock: {
    name: "Clock",
    description: "Your local time and flag",
    category: "utility",
    fields: [
      { key: "timezone", label: "Time zone", kind: "timezone" },
      { key: "city", label: "City", kind: "text", max: 30 },
      { key: "country", label: "Flag (auto from the time zone)", kind: "text", placeholder: "Auto, or a code like AE", max: 2 },
      opacity,
    ],
  },
  countdown: {
    name: "Countdown",
    description: "Count down to a launch or an event",
    category: "utility",
    fields: [
      { key: "title", label: "Title", kind: "text", max: 40 },
      { key: "target", label: "Date", kind: "datetime", required: true },
      { key: "country", label: "Country code", kind: "text", placeholder: "AE", max: 2 },
      { key: "ctaLabel", label: "Button label", kind: "text", max: 20 },
      { key: "ctaUrl", label: "Button link", kind: "url" },
      opacity,
    ],
  },
  reactions: {
    hidden: true,
    name: "Reactions",
    description: "Visitors drop emojis on your profile",
    category: "utility",
    fields: [{ key: "emojis", label: "Emojis", kind: "text", placeholder: "🤑😈💀🤡🤖", max: 40 }],
  },
  link: {
    name: "Link card",
    description: "An image, a few words and a button to your own thing",
    category: "utility",
    fields: [
      { key: "image", label: "Image", kind: "image" },
      { key: "title", label: "Title", kind: "text", max: 40, required: true },
      { key: "body", label: "Text", kind: "textarea", max: 280 },
      { key: "ctaLabel", label: "Button label", kind: "text", placeholder: "Join", max: 20 },
      { key: "url", label: "Link", kind: "url", placeholder: "https://…" },
      opacity,
    ],
  },
  text: {
    name: "Text",
    description: "A note, a quote, an announcement",
    category: "utility",
    fields: [
      { key: "title", label: "Title", kind: "text", max: 40 },
      { key: "body", label: "Text", kind: "textarea", max: 280, required: true },
      opacity,
    ],
  },
} as const satisfies Record<string, WidgetDef>;

export type WidgetType = keyof typeof WIDGETS;
export const WIDGET_TYPES = Object.keys(WIDGETS) as WidgetType[];

export type WidgetSettings = Record<string, string | number | undefined>;

export interface Widget {
  id: string;
  type: WidgetType;
  size: WidgetSize;
  settings: WidgetSettings;
}

export function defaultSettings(type: WidgetType): WidgetSettings {
  const out: WidgetSettings = {};
  for (const f of WIDGETS[type].fields as readonly FieldDef[]) if ("default" in f) out[f.key] = f.default;
  return out;
}

function fieldSchema(f: FieldDef): z.ZodType {
  switch (f.kind) {
    case "number":
      return z.number().min(f.min ?? -Infinity).max(f.max ?? Infinity);
    case "range":
      return z.number().min(f.min).max(f.max);
    case "select":
    case "segmented":
      return z.enum(f.options.map((o) => o.id) as [string, ...string[]]);
    case "color":
      return z.string().regex(/^#[0-9a-fA-F]{6}$/);
    case "url":
      return z.union([z.url({ protocol: /^https?$/ }).max(500), z.literal("")]);
    case "image":
      return imageUrl;
    case "handle":
      return z.string().regex(new RegExp(`^(?:${f.pattern})$`), "Invalid handle");
    case "datetime":
      return z.iso.datetime({ offset: true }).or(z.iso.datetime());
    case "wallets":
      return z.union([z.literal("all"), z.string().regex(/^[A-Za-z0-9]{32,44}(,[A-Za-z0-9]{32,44}){0,9}$/)]);
    case "timezone":
      return z.string().max(64);
    default:
      return z.string().max(f.max ?? 200);
  }
}

export const widgetInput = z
  .object({
    id: z.string().uuid().optional(),
    type: z.enum(WIDGET_TYPES as [WidgetType, ...WidgetType[]]),
    size: z.enum(WIDGET_SIZES),
    settings: z.record(z.string(), z.unknown()),
  })
  .transform((w, ctx) => {
    // Community widgets saved before the invite field kept a full link: turn it into the invite.
    if (w.type === "community" && !w.settings.invite && typeof w.settings.url === "string") {
      const m = w.settings.url.match(/(?:discord\.gg|discord\.com\/invite|t\.me)\/([A-Za-z0-9_-]{2,32})/);
      if (m) w.settings = { ...w.settings, invite: m[1], platform: w.settings.url.includes("t.me") ? "telegram" : "discord" };
    }
    const settings: WidgetSettings = {};
    for (const f of WIDGETS[w.type].fields as readonly FieldDef[]) {
      const raw = w.settings[f.key];
      if (raw === undefined || raw === null || raw === "") {
        if ("required" in f && f.required) ctx.addIssue({ code: "custom", message: `${WIDGETS[w.type].name}: ${f.label} is required` });
        continue;
      }
      const parsed = fieldSchema(f).safeParse(raw);
      if (!parsed.success) ctx.addIssue({ code: "custom", message: `${WIDGETS[w.type].name}: invalid ${f.label}` });
      else settings[f.key] = parsed.data as string | number;
    }
    return { ...w, settings };
  });

export const widgetsInput = z.array(widgetInput).max(60);

/** Full link for a "handle" field, from the settings it lives in. */
export function handleUrl(def: { from: string; prefixes: Record<string, string> }, settings: WidgetSettings, handle: string) {
  const platform = String(settings[def.from] ?? Object.keys(def.prefixes)[0]);
  return `https://${def.prefixes[platform] ?? ""}${handle}`;
}

/** Community widget link: platform + invite handle (older widgets stored a full url). */
export function communityUrl(settings: WidgetSettings): string {
  if (typeof settings.invite === "string" && settings.invite) {
    return `https://${settings.platform === "telegram" ? "t.me" : "discord.gg"}/${settings.invite}`;
  }
  return typeof settings.url === "string" ? settings.url : "";
}
