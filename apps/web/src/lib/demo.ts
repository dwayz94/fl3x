import { BADGES, DEFAULT_THEME, defaultSettings, type FullPublicProfile, type Widget, type WidgetSettings, type WidgetSize, type WidgetType } from "@fl3x/shared";
import type { CommunityData, MediaData, TokenData, WalletData } from "./types";

/**
 * Fixed data for the showcase pages (/widgets and /example), so they look
 * the same for everyone and never hit the API or a real wallet.
 */

const IMG = {
  solamies: "/images/creators/solamies.jpg",
  bi0: "/images/creators/bi0.jpg",
  swifzui: "/images/creators/swifzui.jpg",
  yash: "/images/creators/yash.jpg",
  hero: "/images/backgrounds/hero-bg.png",
  sign: "/images/backgrounds/sign-bg.png",
};

export const DEMO_WALLET = "DEMO1111111111111111111111111111111111111111";

function history(points: number, start: number, end: number, seed: number) {
  // Seeded random walk bent toward the end value, so the chart looks like a real wallet.
  let x = seed;
  const rand = () => ((x = (x * 16807) % 2147483647) / 2147483647) - 0.5;
  const out: { at: string; valueUsd: number }[] = [];
  const now = Date.UTC(2026, 9, 28);
  let drift = 0;
  for (let i = 0; i < points; i++) {
    const t = i / (points - 1);
    drift = drift * 0.8 + rand() * 0.03;
    // A dip in the first third, then the rally: reads like a real month.
    const shape = t - 0.18 * Math.sin(Math.PI * Math.min(1, t * 1.6));
    const v = i === points - 1 ? end : (start + (end - start) * shape) * (1 + drift);
    out.push({ at: new Date(now - (points - i) * 3_600_000).toISOString(), valueUsd: v });
  }
  return out;
}

const wallet: WalletData = {
  wallet: DEMO_WALLET,
  valueUsd: 134_548.73,
  period: "1m",
  start: { valueUsd: 91_270.12, at: "2026-09-28T00:00:00.000Z" },
  changeUsd: 12_276.34,
  changePct: 49.4,
  history: history(40, 91_000, 134_548.73, 7),
  holdings: [
    { mint: "So11111111111111111111111111111111111111112", symbol: "SOL", name: "Solana", iconUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", amount: 412.8, valueUsd: 71_100, change24h: 7.3 },
    { mint: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", symbol: "BONK", name: "Bonk", iconUrl: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I", amount: 1_118_903_310, valueUsd: 31_420, change24h: 12.1 },
    { mint: "demo-fl3x", symbol: "FL3X", name: "FL3X", iconUrl: "/images/fl3x-icon.svg", amount: 2_400_000, valueUsd: 21_800, change24h: 73 },
    { mint: "demo-pingu", symbol: "PINGU", name: "Pingu", iconUrl: IMG.swifzui, amount: 860_000, valueUsd: 10_228, change24h: -4.2 },
  ],
};

const tokens: Record<string, TokenData> = {
  pingu: { chain: "solana", address: "pingu", name: "Pingu Nietzschean", symbol: "PINGU", priceUsd: 0.0005, marketCap: 500_000, change24h: 18, imageUrl: IMG.swifzui, url: "#" },
  fl3x: { chain: "solana", address: "fl3x", name: "FL3X", symbol: "FL3X", priceUsd: 0.0021, marketCap: 2_100_000, change24h: 42, imageUrl: "/images/fl3x-icon.svg", url: "#" },
};

const communities: Record<string, CommunityData> = {
  telegram: { platform: "telegram", name: "FL3X Commxnity", iconUrl: IMG.bi0, members: 11_972, online: 3_454, url: "#" },
  discord: { platform: "discord", name: "FL3X Discord", iconUrl: IMG.yash, members: 11_972, online: 3_454, url: "#" },
};

const media: Record<string, MediaData> = {
  youtube: { provider: "youtube", title: "How I made 7K this month day trading", author: "Solamies", thumbnailUrl: IMG.hero, live: false, url: "#" },
  twitch: { provider: "twitch", title: "Pingu Nietzschean live: memecoin hunting", author: "solamies", thumbnailUrl: IMG.yash, live: true, url: "#" },
  spotify: { provider: "spotify", title: "Ça tire", author: "JUL, Houari, Kalash", thumbnailUrl: IMG.bi0, live: null, url: "#" },
};

/** Resolver for DemoDataProvider: every widget param starting with "demo:" maps to fixed data. */
export function resolveDemo(path: string, params: Record<string, string | undefined>): unknown {
  switch (path) {
    case "wallet":
      return params.address === DEMO_WALLET ? wallet : undefined;
    case "token":
      return tokens[params.address?.replace("demo:", "") ?? ""];
    case "community":
      return communities[params.url?.replace("demo:", "") ?? ""];
    case "media":
      return media[params.url?.replace("demo:", "") ?? ""];
  }
  return undefined;
}

const LOREM =
  "It will go much higher when mack shares it on Binance futures. x10 from here, easy. Kept a journal of every trade this month, wins and the painful ones.";

/** Showcase settings per widget type (one entry per variant shown on /widgets). */
export const DEMO_WIDGETS: { type: WidgetType; label?: string; settings: WidgetSettings }[] = [
  { type: "pnl", settings: { wallet: DEMO_WALLET, period: "1m" } },
  { type: "portfolio", settings: { wallet: DEMO_WALLET, period: "7d" } },
  { type: "holdings", settings: { wallet: DEMO_WALLET } },
  { type: "token", settings: { chain: "solana", address: "demo:pingu", note: "It will go much higher when mack shares it on Binance futures, x10 from here easy" } },
  { type: "community", label: "Telegram", settings: { url: "demo:telegram" } },
  { type: "community", label: "Discord", settings: { url: "demo:discord" } },
  { type: "followers", settings: { platform: "x", handle: "solamies", count: 1_675_434 } },
  { type: "video", label: "YouTube", settings: { url: "demo:youtube", note: "It will go much higher when mack shares it on Binance futures, x10 from here easy" } },
  { type: "video", label: "Twitch (on live)", settings: { url: "demo:twitch", note: "Come hang, calls every night." } },
  { type: "music", settings: { url: "demo:spotify" } },
  { type: "image", settings: { url: IMG.swifzui } },
  { type: "link", label: "With button", settings: { image: IMG.swifzui, title: "Pingu NFT drop", body: LOREM, ctaLabel: "Mint now", url: "https://fl3x.lol" } },
  { type: "link", label: "Journal (no button)", settings: { image: IMG.bi0, title: "Today journal", body: LOREM + " " + LOREM } },
  { type: "clock", settings: { timezone: "Asia/Dubai", city: "Dubai,", country: "AE" } },
  { type: "countdown", settings: { title: "Launch of new Pingu NFT!", target: "2026-11-29T18:00:00.000Z", country: "AE", ctaLabel: "View more", ctaUrl: "https://fl3x.lol" } },
  { type: "reactions", settings: { emojis: "🤑😈💀🤡🤖🐳" } },
  { type: "text", settings: { title: "Gm", body: LOREM } },
];

export const DEMO_BACKGROUNDS: { id: string; label: string; url: string | null }[] = [
  // Moodboard images from the Figma (kept out of git, local preview only).
  ...[1, 2, 3, 4, 5, 6].map((n) => ({ id: `figma-${n}`, label: `Figma ${n}`, url: `/images/demo-bg/bg-${n}.jpg` })),
  { id: "hero", label: "FL3X hero", url: IMG.hero },
  { id: "sign", label: "FL3X money", url: IMG.sign },
  { id: "footer", label: "FL3X footer", url: "/images/backgrounds/footer-bg.png" },
  { id: "none", label: "No image", url: null },
];

export function demoWidget(type: WidgetType, size: WidgetSize, settings: WidgetSettings, id: string): Widget {
  return { id, type, size, settings: { ...defaultSettings(type), ...settings } };
}

function pick(i: number, size: WidgetSize, id: string) {
  const d = DEMO_WIDGETS[i]!;
  return demoWidget(d.type, size, d.settings, id);
}

const byType = (t: WidgetType, nth = 0) => DEMO_WIDGETS.findIndex((d, i) => d.type === t && DEMO_WIDGETS.slice(0, i).filter((x) => x.type === t).length === nth);

/** Layout variants of the example profile, from the Figma card variants. */
export const DEMO_LAYOUTS: { id: string; label: string; widgets: Widget[] }[] = [
  {
    id: "full",
    label: "Everything",
    widgets: [
      pick(byType("pnl"), "large", "w-pnl"),
      pick(byType("community"), "long", "w-tg"),
      pick(byType("community", 1), "long", "w-dc"),
      pick(byType("token"), "large", "w-token"),
      pick(byType("portfolio"), "long", "w-portfolio"),
      pick(byType("followers"), "long", "w-followers"),
      pick(byType("clock"), "large", "w-clock"),
      pick(byType("link"), "large", "w-link"),
      pick(byType("video"), "long", "w-video"),
      pick(byType("music"), "long", "w-music"),
      pick(byType("holdings"), "large", "w-holdings"),
      pick(byType("countdown"), "large", "w-countdown"),
      pick(byType("reactions"), "large", "w-reactions"),
      pick(byType("image"), "large", "w-image"),
      pick(byType("video", 1), "long", "w-live"),
      pick(byType("link", 1), "long", "w-journal"),
    ],
  },
  {
    id: "classic",
    label: "Classic",
    widgets: [
      pick(byType("pnl"), "large", "w-pnl"),
      pick(byType("community"), "long", "w-tg"),
      pick(byType("community", 1), "long", "w-dc"),
      pick(byType("token"), "large", "w-token"),
    ],
  },
  {
    id: "compact",
    label: "Compact",
    widgets: [pick(byType("pnl"), "large", "w-pnl"), pick(byType("token"), "large", "w-token"), pick(byType("community"), "long", "w-tg")],
  },
  { id: "minimal", label: "Minimal", widgets: [pick(byType("community"), "long", "w-tg")] },
];

export function demoProfile(widgets: Widget[], backgroundUrl: string | null = DEMO_BACKGROUNDS[0]!.url): FullPublicProfile {
  return {
    username: "solamies",
    displayName: "Solamies",
    bio: "FL3X on all screen!",
    avatarUrl: IMG.solamies,
    badges: BADGES.map((b) => b.id),
    theme: backgroundUrl ? { ...DEFAULT_THEME, background: "image", backgroundUrl } : { ...DEFAULT_THEME, background: "plain" },
    widgets,
    links: [
      { id: "l1", kind: "website", url: "https://fl3x.lol", label: "fl3x.lol" },
      { id: "l2", kind: "discord", url: "https://discord.gg/fl3x", label: null },
      { id: "l3", kind: "x", url: "https://x.com/fl3xlol", label: null },
      { id: "l4", kind: "telegram", url: "https://t.me/fl3x", label: null },
    ],
    tier: "premium",
    xHandle: "solamies",
    views: 456_432,
  };
}
