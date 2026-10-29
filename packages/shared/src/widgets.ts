import { z } from "zod";

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
  | { key: string; label: string; kind: "number"; min?: number; max?: number }
  | { key: string; label: string; kind: "select" | "segmented"; options: readonly Opt[]; default: string }
  | { key: string; label: string; kind: "wallet" }
  | { key: string; label: string; kind: "datetime"; required?: boolean }
  | { key: string; label: string; kind: "timezone" }
  | { key: string; label: string; kind: "color"; default: string }
  | { key: string; label: string; kind: "range"; min: number; max: number; default: number };

export interface WidgetDef {
  name: string;
  description: string;
  category: "crypto" | "social" | "media" | "utility";
  fields: readonly FieldDef[];
}

const accent: FieldDef = { key: "accent", label: "Color", kind: "color", default: "#2FE3AC" };
/** Design version. V2 is the default (kept on 2026-10-29); V1 stays available for whoever prefers it. */
const style: FieldDef = { key: "style", label: "Style", kind: "segmented", options: [{ id: "v2", label: "V2" }, { id: "v1", label: "V1" }], default: "v2" };
export const V2_WIDGETS = ["portfolio", "music", "clock", "followers"] as const;
const opacity: FieldDef = { key: "bgOpacity", label: "Background opacity", kind: "range", min: 20, max: 100, default: 100 };

export const WIDGETS = {
  pnl: {
    name: "P&L Card",
    description: "Profit and loss of a verified wallet over a period",
    category: "crypto",
    fields: [
      { key: "wallet", label: "Wallet", kind: "wallet" },
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
      style,
      { key: "wallet", label: "Wallet", kind: "wallet" },
      { key: "period", label: "Time", kind: "segmented", options: PERIODS, default: "7d" },
      opacity,
    ],
  },
  holdings: {
    name: "Holdings",
    description: "Wallet value and its biggest bags",
    category: "crypto",
    fields: [{ key: "wallet", label: "Wallet", kind: "wallet" }, opacity],
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
      { key: "url", label: "Invite link", kind: "url", placeholder: "https://discord.gg/… or https://t.me/…", required: true },
      opacity,
    ],
  },
  followers: {
    name: "Followers",
    description: "Show off your follower count",
    category: "social",
    fields: [
      style,
      { key: "platform", label: "Platform", kind: "select", options: [{ id: "x", label: "X" }, { id: "youtube", label: "YouTube" }, { id: "twitch", label: "Twitch" }, { id: "tiktok", label: "TikTok" }, { id: "instagram", label: "Instagram" }], default: "x" },
      { key: "handle", label: "Handle", kind: "text", placeholder: "@you", max: 40, required: true },
      { key: "count", label: "Followers", kind: "number", min: 0, max: 1_000_000_000 },
      opacity,
    ],
  },
  video: {
    name: "Video",
    description: "A YouTube video or your Twitch channel",
    category: "media",
    fields: [
      { key: "url", label: "Video or channel link", kind: "url", placeholder: "https://youtube.com/… or https://twitch.tv/…", required: true },
      { key: "note", label: "Description", kind: "textarea", max: 140 },
      opacity,
    ],
  },
  music: {
    name: "Music",
    description: "A Spotify track, album or playlist",
    category: "media",
    fields: [
      style,
      { key: "url", label: "Spotify link", kind: "url", placeholder: "https://open.spotify.com/…", required: true },
      opacity,
    ],
  },
  image: {
    name: "Image",
    description: "A picture or GIF",
    category: "media",
    fields: [
      { key: "url", label: "Image URL", kind: "url", placeholder: "https://…/image.gif", required: true },
      { key: "caption", label: "Caption", kind: "text", max: 60 },
    ],
  },
  clock: {
    name: "Clock",
    description: "Your local time and flag",
    category: "utility",
    fields: [
      style,
      { key: "timezone", label: "Time zone", kind: "timezone" },
      { key: "city", label: "City", kind: "text", max: 30 },
      { key: "country", label: "Country code", kind: "text", placeholder: "AE", max: 2 },
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
      { key: "image", label: "Image URL", kind: "url", placeholder: "https://…/cover.png" },
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
    case "datetime":
      return z.iso.datetime({ offset: true }).or(z.iso.datetime());
    case "wallet":
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
