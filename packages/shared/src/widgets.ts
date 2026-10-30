import { z } from "zod";
import { imageUrl } from "./profile";
import { isCountryCode, localTimeZone, resolveClock } from "./timezones";

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

/**
 * Shown (and required, if it is) only while another field has one of these values:
 * e.g. the color picker only when "Background" is "Color". Hidden values are kept, not validated.
 */
type ShowWhen = {
  when?: { key: string; is: readonly string[] };
  /**
   * Premium-only: `true` locks the whole field, a list locks only those options.
   * Others keep the default (the editor shows a lock, the API resets it on save).
   */
  premium?: true | readonly string[];
};

export type FieldDef = ShowWhen & (
  | { key: string; label: string; kind: "text" | "textarea"; placeholder?: string; max?: number; required?: boolean }
  /** `pattern` narrows the link (e.g. Spotify tracks only), `hint` is the error then. */
  | { key: string; label: string; kind: "url"; placeholder?: string; required?: boolean; pattern?: string; hint?: string }
  /**
   * A handle typed after a fixed domain, picked by the `from` field
   * (e.g. platform "discord" → discord.gg/). Keeps links on the right site.
   */
  | { key: string; label: string; kind: "handle"; from: string; prefixes: Record<string, string>; pattern: string; required?: boolean }
  /** Uploaded image (or a link to one). */
  | { key: string; label: string; kind: "image"; required?: boolean }
  | { key: string; label: string; kind: "number"; min?: number; max?: number }
  | { key: string; label: string; kind: "select" | "segmented"; options: readonly Opt[]; default: string }
  /**
   * "all" (every verified wallet, the default) or a comma-separated list of addresses.
   * `network` names a field ("solana" | "evm") that limits which wallets count.
   */
  | { key: string; label: string; kind: "wallets"; default: string; network?: string }
  | { key: string; label: string; kind: "datetime"; required?: boolean }
  /** Country picker (ISO code, flag + name). */
  | { key: string; label: string; kind: "country" }
  /** Time zone limited to the zones of the `country` field: set by itself when the country has only one. */
  | { key: string; label: string; kind: "timezone"; country: string }
  /** Display name of the clock's place: emptied when the country or zone changes, the zone's city shows meanwhile. */
  | { key: string; label: string; kind: "city"; timezone: string; country: string; max?: number }
  | { key: string; label: string; kind: "color"; default: string }
  | { key: string; label: string; kind: "range"; min: number; max: number; default: number }
);

export interface WidgetDef {
  name: string;
  description: string;
  category: "crypto" | "social" | "media" | "utility";
  fields: readonly FieldDef[];
  /** Kept working for existing profiles but no longer offered in the library. */
  hidden?: boolean;
}

const wallets = { key: "wallets", label: "Wallets", kind: "wallets", default: "all" } as const satisfies FieldDef;

/** Wallet families a widget can be limited to (EVM covers Ethereum, Base, BNB, Arbitrum, Robinhood…). */
export const NETWORKS = [
  { id: "solana", label: "Solana" },
  { id: "evm", label: "EVM" },
] as const;
export type Network = (typeof NETWORKS)[number]["id"];
/** Which family an address belongs to (EVM addresses are 0x…, Solana ones base58). */
export const addressNetwork = (address: string): Network => (address.startsWith("0x") ? "evm" : "solana");
/** Keeps the addresses of one family; any other value (unset) keeps them all. */
export const onNetwork = (addresses: string[], network: unknown) =>
  network === "solana" || network === "evm" ? addresses.filter((a) => addressNetwork(a) === network) : addresses;
/** Design version. V2 is the default (kept on 2026-10-29); V1 stays available for whoever prefers it. */
/** Media widgets: blurred cover colors behind (default), plain glass, or a color. */
const background: FieldDef = {
  key: "background", label: "Background", kind: "segmented", default: "cover",
  options: [{ id: "cover", label: "Cover colors" }, { id: "glass", label: "Glass" }, { id: "color", label: "Color" }],
  premium: ["color"],
};

/**
 * Widget background, the same two fields on every compatible widget (Premium):
 * frosted glass (default) or a color of your choice. Drawn by WidgetFrame, so a new
 * widget gets it by adding `...surface` to its fields.
 */
export const SURFACES = [
  { id: "glass", label: "Glass" },
  { id: "color", label: "Color" },
] as const;
const surface: FieldDef[] = [
  { key: "surface", label: "Background", kind: "segmented", options: SURFACES, default: "glass", premium: ["color"] },
  { key: "surfaceColor", label: "Background color", kind: "color", default: "#FF97CB", when: { key: "surface", is: ["color"] }, premium: true },
];
const tint: FieldDef = { key: "tint", label: "Color", kind: "color", default: "#7B5CFF", when: { key: "background", is: ["color"] }, premium: true };
const opacity: FieldDef = { key: "bgOpacity", label: "Background opacity", kind: "range", min: 20, max: 100, default: 100 };

export const WIDGETS = {
  pnl: {
    name: "P&L Card",
    description: "Profit and loss of your Solana or EVM wallets over a period",
    category: "crypto",
    fields: [
      { key: "network", label: "Network", kind: "segmented", options: NETWORKS, default: "solana" },
      { ...wallets, network: "network" },
      { key: "period", label: "Time", kind: "segmented", options: PERIODS, default: "1m" },
      opacity,
      ...surface,
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
      ...surface,
    ],
  },
  holdings: {
    name: "Holdings",
    description: "Wallet value and its biggest bags",
    category: "crypto",
    fields: [wallets, opacity, ...surface],
  },
  nfts: {
    name: "NFT Gallery",
    description: "NFTs from your verified Solana wallets",
    category: "crypto",
    fields: [wallets, opacity, ...surface],
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
      ...surface,
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
      ...surface,
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
      ...surface,
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
      { key: "source", label: "Show", kind: "segmented", options: [{ id: "spotify", label: "Currently listening" }, { id: "link", label: "A track" }], default: "spotify" },
      {
        key: "url", label: "Spotify track link", kind: "url", placeholder: "https://open.spotify.com/track/…", required: true,
        pattern: "^https://open\\.spotify\\.com/(intl-[a-z-]+/)?track/[A-Za-z0-9]+", hint: "Paste a Spotify track link (open.spotify.com/track/…)",
        when: { key: "source", is: ["link"] },
      },
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
      { key: "country", label: "Country", kind: "country" },
      { key: "timezone", label: "Time zone", kind: "timezone", country: "country" },
      { key: "city", label: "City", kind: "city", timezone: "timezone", country: "country", max: 30 },
      opacity,
      ...surface,
    ],
  },
  countdown: {
    name: "Countdown",
    description: "Count down to a launch or an event",
    category: "utility",
    fields: [
      { key: "title", label: "Title", kind: "text", max: 40 },
      { key: "target", label: "Date", kind: "datetime", required: true },
      { key: "country", label: "Flag (optional)", kind: "country" },
      { key: "ctaLabel", label: "Button label", kind: "text", max: 20 },
      { key: "ctaUrl", label: "Button link", kind: "url" },
      opacity,
      ...surface,
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
      { key: "url", label: "Link", kind: "url", placeholder: "https://…", required: true },
      opacity,
      ...surface,
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
      ...surface,
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
  for (const f of WIDGETS[type].fields as readonly FieldDef[]) {
    if ("default" in f) out[f.key] = f.default;
    // New clocks start on the member's own zone (the country follows from it).
    else if (f.kind === "timezone") {
      const tz = localTimeZone();
      if (tz) out[f.key] = tz;
    }
  }
  return out;
}

/** Whether a field applies with these settings (see `when`); a missing value counts as the field's default. */
export function fieldShown(type: WidgetType, f: FieldDef, settings: Record<string, unknown>): boolean {
  if (!f.when) return true;
  const dep = (WIDGETS[type].fields as readonly FieldDef[]).find((d) => d.key === f.when!.key);
  const value = settings[f.when.key] ?? (dep && "default" in dep ? dep.default : undefined);
  return f.when.is.includes(String(value));
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
    case "url": {
      const url = z.url({ protocol: /^https?$/ }).max(500);
      return z.union([f.pattern ? url.regex(new RegExp(f.pattern), f.hint) : url, z.literal("")]);
    }
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
    case "country":
      // Older clocks kept a free 2-letter text: an unknown code is dropped (the flag then follows the zone).
      return z.string().max(2).transform((v) => (isCountryCode(v) ? v.toUpperCase() : undefined));
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
    // Music widgets saved before "source" existed only had a link.
    if (w.type === "music" && !w.settings.source && w.settings.url) w.settings = { ...w.settings, source: "link" };
    const settings: WidgetSettings = {};
    for (const f of WIDGETS[w.type].fields as readonly FieldDef[]) {
      const raw = w.settings[f.key];
      const shown = fieldShown(w.type, f, w.settings);
      if (raw === undefined || raw === null || raw === "") {
        if (shown && "required" in f && f.required) ctx.addIssue({ code: "custom", message: `${WIDGETS[w.type].name}: ${f.label} is required` });
        continue;
      }
      const parsed = fieldSchema(f).safeParse(raw);
      // A hidden field keeps a valid old value (switching back restores it) and drops an invalid one silently.
      if (!parsed.success) {
        if (shown) ctx.addIssue({ code: "custom", message: `${WIDGETS[w.type].name}: ${("hint" in f && f.hint) || `invalid ${f.label}`}` });
      } else if (parsed.data !== undefined) settings[f.key] = parsed.data as string | number;
    }
    // Video: a channel, or one pinned video.
    if (w.type === "video" && !w.settings.channel && !w.settings.url) ctx.addIssue({ code: "custom", message: "Video: add a channel or a video link" });
    // A clock's zone always belongs to its country (older clocks get the country from the zone).
    for (const f of WIDGETS[w.type].fields as readonly FieldDef[]) {
      if (f.kind !== "timezone" || (settings[f.key] === undefined && settings[f.country] === undefined)) continue;
      const clock = resolveClock({ timezone: settings[f.key], country: settings[f.country] });
      settings[f.key] = clock.timezone;
      if (clock.country) settings[f.country] = clock.country;
    }
    return { ...w, settings };
  });

export const widgetsInput = z.array(widgetInput).max(60);

/** Whether a field (or one of its options) is locked to Premium. */
export function premiumLocked(f: FieldDef, value?: unknown): boolean {
  if (!f.premium) return false;
  return f.premium === true || (value !== undefined && f.premium.includes(String(value)));
}

/** Drops the Premium-only settings of a widget (non-Premium saves): the defaults apply instead. */
export function stripPremium(type: WidgetType, settings: WidgetSettings): WidgetSettings {
  const out = { ...settings };
  for (const f of WIDGETS[type].fields as readonly FieldDef[]) if (premiumLocked(f, out[f.key])) delete out[f.key];
  return out;
}

/**
 * What still has to be filled in before a widget can be saved (empty = ready).
 * Same rules the API applies on save, so the editor can block the button first.
 */
export function widgetProblems(w: { type: WidgetType; size: WidgetSize; settings: Record<string, unknown> }): string[] {
  const r = widgetInput.safeParse(w);
  return r.success ? [] : r.error.issues.map((i) => i.message.replace(/^[^:]+: /, ""));
}

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
