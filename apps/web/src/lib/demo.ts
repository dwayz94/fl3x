import { BADGES, DEFAULT_THEME, defaultSettings, type FullPublicProfile, type Widget, type WidgetSettings, type WidgetSize, type WidgetType } from "@fl3x/shared";
import type { PortfolioData } from "@fl3x/shared";
import type { CommunityData, MediaData, TokenData } from "./types";

/**
 * Fixed data for the showcase pages (/widgets and /example), so they look
 * the same for everyone and never hit the API or a real wallet.
 */

/** Generic art only (scripts/demo-art.py): no real people in demos. */
const IMG = {
  avatar: "/images/demo/avatar-1.svg",
  avatar2: "/images/demo/avatar-2.svg",
  avatar3: "/images/demo/avatar-3.svg",
  avatar4: "/images/demo/avatar-4.svg",
  cover: "/images/demo/cover-1.svg",
  cover2: "/images/demo/cover-2.svg",
  cover3: "/images/demo/cover-3.svg",
  cover4: "/images/demo/cover-4.svg",
  fl3x: "/brand/fl3x-app-icon-pink.svg",
  hero: "/images/backgrounds/hero-bg.png",
  sign: "/images/backgrounds/sign-bg.png",
};

/** A real track (Spotify page + cover); title and artist come from Spotify. */
export const DEMO_TRACK_URL = "https://open.spotify.com/track/0j2T0R9dR9qdJYsB7ciXhf";

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

const wallet: PortfolioData = {
  valueUsd: 134_548.73,
  period: "1m",
  start: { valueUsd: 91_270.12, at: "2026-09-28T00:00:00.000Z" },
  changeUsd: 12_276.34,
  changePct: 49.4,
  history: history(40, 91_000, 134_548.73, 7),
  holdings: [
    { id: "So11111111111111111111111111111111111111112", chain: "solana", symbol: "SOL", name: "Solana", iconUrl: "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png", amount: 412.8, valueUsd: 71_100, change24h: 7.3 },
    { id: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", chain: "solana", symbol: "BONK", name: "Bonk", iconUrl: "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I", amount: 1_118_903_310, valueUsd: 31_420, change24h: 12.1 },
    { id: "demo-eth", chain: "ethereum", symbol: "ETH", name: "Ether", iconUrl: "https://icons.llamao.fi/icons/chains/rsz_ethereum?w=48&h=48", amount: 9.4, valueUsd: 21_800, change24h: 3.1 },
    { id: "demo-fl3x", chain: "solana", symbol: "FL3X", name: "FL3X", iconUrl: "/images/fl3x-icon.svg", amount: 2_400_000, valueUsd: 21_800, change24h: 73 },
    { id: "demo-nova", chain: "solana", symbol: "NOVA", name: "Nova", iconUrl: IMG.avatar3, amount: 860_000, valueUsd: 10_228, change24h: -4.2 },
  ],
  networks: [
    { id: "solana", name: "Solana", valueUsd: 112_748.73 },
    { id: "ethereum", name: "Ethereum", valueUsd: 21_800 },
  ],
  wallets: 2,
};

const tokens: Record<string, TokenData> = {
  nova: { chain: "solana", address: "nova", name: "Nova", symbol: "NOVA", priceUsd: 0.0005, marketCap: 500_000, change24h: 18, imageUrl: IMG.avatar3, url: "#" },
  fl3x: { chain: "solana", address: "fl3x", name: "FL3X", symbol: "FL3X", priceUsd: 0.0021, marketCap: 2_100_000, change24h: 42, imageUrl: "/images/fl3x-icon.svg", url: "#" },
};

const communities: Record<string, CommunityData> = {
  telegram: { platform: "telegram", name: "FL3X Community", iconUrl: IMG.fl3x, members: 11_972, online: 3_454, url: "https://t.me/fl3xdotlol" },
  discord: { platform: "discord", name: "FL3X Discord", iconUrl: IMG.fl3x, members: 11_972, online: 3_454, url: "https://discord.gg/fl3x" },
};

const media: Record<string, MediaData> = {
  youtube: { provider: "youtube", title: "What a month of on-chain trading taught me", author: "Nova", thumbnailUrl: IMG.cover2, live: false, url: "#" },
  twitch: { provider: "twitch", title: "Late-night memecoin hunting", author: "nova", thumbnailUrl: IMG.cover4, avatarUrl: IMG.avatar, live: true, viewers: 1840, url: "#" },
  spotify: {
    provider: "spotify",
    title: "Stronger",
    author: "Kanye West",
    thumbnailUrl: "https://image-cdn-fa.spotifycdn.com/image/ab67616d00001e0226f7f19c7f0381e56156c94a",
    live: null,
    url: DEMO_TRACK_URL,
  },
};

/** Resolver for DemoDataProvider: every widget param starting with "demo:" maps to fixed data. */
export function resolveDemo(path: string, params: Record<string, string | undefined>): unknown {
  switch (path) {
    case "nfts":
      // Library preview: real Solana NFTs (shrunk copies in /images/demo/nfts).
      return {
        items: [
          ["y00t-4718", "y00t #4718", "y00ts"],
          ["degod-3744", "DeGod #3744", "DeGods"],
          ["doge-capital-908", "Doge Capital #908", "Doge Capital"],
          ["meego-1339", "Meego #1339", "Meegos"],
        ].map(([file, name, collection]) => ({ id: `demo-${file}`, name: name!, image: `/images/demo/nfts/${file}.webp`, collection: collection! })),
        total: 24,
        wallets: 1,
      };
    case "portfolio":
      return wallet;
    case "token":
      return tokens[params.address?.replace("demo:", "") ?? ""];
    case "community":
      return params.url?.includes("t.me/") ? communities.telegram : params.url?.includes("discord.gg/") ? communities.discord : undefined;
    case "media":
      // The landing's real song stays fixed: the hero never waits on (or breaks with) the API.
      return params.url === DEMO_TRACK_URL ? media.spotify : media[params.url?.replace("demo:", "") ?? ""];
    case "channel":
      return params.platform === "twitch" ? media.twitch : { ...media.youtube, avatarUrl: IMG.avatar, publishedAt: "2026-10-26T18:00:00.000Z" };
    case "followers":
      return { platform: params.platform, handle: params.handle, count: 48_210, approximate: false };
    case "spotify-now":
      return { ...media.spotify, nowPlaying: true };
  }
  return undefined;
}

const LOREM =
  "Kept a journal of every trade this month, the wins and the painful ones. Small size, clear entries, no revenge trades.";

/** Showcase settings per widget type (one entry per variant shown on /widgets). */
export const DEMO_WIDGETS: { type: WidgetType; label?: string; settings: WidgetSettings }[] = [
  { type: "pnl", settings: { period: "1m" } },
  { type: "portfolio", settings: { period: "7d" } },
  { type: "holdings", settings: {} },
  { type: "nfts", settings: {} },
  { type: "token", settings: { chain: "solana", address: "demo:nova", note: "My main bag this cycle. Not financial advice." } },
  { type: "community", label: "Telegram", settings: { platform: "telegram", invite: "fl3x" } },
  { type: "community", label: "Discord", settings: { platform: "discord", invite: "fl3x" } },
  { type: "followers", settings: { platform: "x", handle: "nova" } },
  { type: "video", label: "YouTube, latest upload", settings: { platform: "youtube", channel: "nova" } },
  { type: "video", label: "Twitch, live now", settings: { platform: "twitch", channel: "nova" } },
  { type: "music", label: "My Spotify, now playing", settings: { source: "spotify" } },
  { type: "image", settings: { url: "/images/demo/photo.webp" } },
  { type: "link", label: "With button", settings: { image: IMG.cover3, title: "Genesis pass drop", body: LOREM, ctaLabel: "Mint now", url: "https://fl3x.lol" } },
  { type: "link", label: "Journal (no button)", settings: { image: IMG.cover2, title: "Trading journal", body: LOREM + " " + LOREM } },
  { type: "clock", settings: { timezone: "Asia/Dubai", city: "Dubai,", country: "AE" } },
  { type: "countdown", settings: { title: "Season 2 drop", target: "2026-11-29T18:00:00.000Z", country: "AE", ctaLabel: "View more", ctaUrl: "https://fl3x.lol" } },
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
    username: "nova",
    displayName: "Nova",
    bio: "FL3X on all screens!",
    avatarUrl: IMG.avatar,
    badges: BADGES.map((b) => b.id),
    theme: backgroundUrl ? { ...DEFAULT_THEME, background: "image", backgroundUrl } : { ...DEFAULT_THEME, background: "plain" },
    widgets,
    links: [
      { id: "l1", kind: "website", url: "https://fl3x.lol", label: "fl3x.lol" },
      { id: "l2", kind: "discord", url: "https://discord.gg/fl3x", label: null },
      { id: "l3", kind: "x", url: "https://x.com/fl3xlol", label: null },
      { id: "l4", kind: "telegram", url: "https://t.me/fl3x", label: null },
      { id: "l5", kind: "axiom", url: "https://axiom.trade/@bjm", label: null },
      { id: "l6", kind: "gmgn", url: "https://gmgn.ai/r/panzonhl", label: null },
      { id: "l7", kind: "padre", url: "https://trade.padre.gg/rk/alxcooks", label: null },
      { id: "l8", kind: "proxima", url: "https://proxima.tools/@jay", label: null },
    ],
    tier: "premium",
    xHandle: "nova",
    views: 456_432,
  };
}
