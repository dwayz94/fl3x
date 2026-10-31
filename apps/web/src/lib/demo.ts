import { BADGES, DEFAULT_THEME, defaultSettings, type FullPublicProfile, type Widget, type WidgetSettings, type WidgetSize, type WidgetType } from "@fl3x/shared";
import type { HyperliquidData, PolymarketData, PortfolioData, TradesData } from "@fl3x/shared";
import type { CommunityData, MediaData, TokenData } from "./types";

/**
 * Fixed data for the showcase pages (/widgets and /example), so they look
 * the same for everyone and never hit the API or a real wallet.
 */

/** Generic art only (scripts/demo-art.py): no real people in demos. */
const IMG = {
  cover: "/images/demo/cover-1.svg",
  cover2: "/images/demo/cover-2.svg",
  cover3: "/images/demo/cover-3.svg",
  cover4: "/images/demo/cover-4.svg",
  fl3x: "/brand/fl3x-app-icon-pink.svg",
  hero: "/images/backgrounds/hero-bg.png",
  sign: "/images/backgrounds/sign-bg.png",
};

/** A real track (Spotify page + cover); title and artist come from Spotify. */
export const DEMO_TRACK_URL = "https://open.spotify.com/track/7KXjTSCq5nL1LoYtL7XAwS";

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

const SOL_ICON = "https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png";
const BONK_ICON = "https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I";
const WIF_ICON = "/images/demo/real/wif.jpg";
const JUP_ICON = "/images/demo/real/jup.png";
const POPCAT_ICON = "/images/demo/real/popcat.jpg";

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
    { id: "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm", chain: "solana", symbol: "WIF", name: "dogwifhat", iconUrl: WIF_ICON, amount: 58_100, valueUsd: 10_228, change24h: -4.2 },
  ],
  networks: [
    { id: "solana", name: "Solana", valueUsd: 112_748.73 },
    { id: "ethereum", name: "Ethereum", valueUsd: 21_800 },
  ],
  wallets: 2,
};

/** A month of daily values (calendar preview): mostly green days, a few red. */
const monthly = (() => {
  const out: { at: string; valueUsd: number }[] = [];
  let v = 91_000;
  for (let d = 30; d >= 0; d--) {
    v *= 1 + Math.sin(d * 1.7) * 0.035 + 0.012;
    out.push({ at: new Date(Date.now() - d * 86_400_000).toISOString(), valueUsd: v });
  }
  return out;
})();

const trades: TradesData = {
  wallets: 1,
  items: [
    { id: "demo-1", at: new Date(Date.now() - 2 * 3_600_000).toISOString(), side: "buy", token: { address: "bonk", symbol: "BONK", name: "Bonk", iconUrl: BONK_ICON }, amount: 41_200_000, quote: { symbol: "SOL", amount: 4.2 }, valueUsd: 744 },
    { id: "demo-2", at: new Date(Date.now() - 7 * 3_600_000).toISOString(), side: "sell", token: { address: "wif", symbol: "WIF", name: "dogwifhat", iconUrl: WIF_ICON }, amount: 120_000, quote: { symbol: "SOL", amount: 9.8 }, valueUsd: 1_736 },
    { id: "demo-3", at: new Date(Date.now() - 26 * 3_600_000).toISOString(), side: "buy", token: { address: "fl3x", symbol: "FL3X", name: "FL3X", iconUrl: "/images/fl3x-icon.svg" }, amount: 2_400_000, quote: { symbol: "USDC", amount: 5_000 }, valueUsd: 5_000 },
    { id: "demo-4", at: new Date(Date.now() - 3 * 86_400_000).toISOString(), side: "sell", token: { address: "sol", symbol: "SOL", name: "Solana", iconUrl: SOL_ICON }, amount: 12, quote: { symbol: "USDC", amount: 2_124 }, valueUsd: 2_124 },
  ],
};

const hyperliquid: HyperliquidData = {
  wallets: 1,
  accountValue: 48_230,
  unrealizedPnl: 2_310,
  pnl: { day: 1_120, week: 4_870, month: 12_640, allTime: 38_900 },
  positions: [
    { coin: "BTC", side: "long", size: 0.4, entryPx: 98_200, valueUsd: 41_000, unrealizedPnl: 1_740, leverage: 5 },
    { coin: "SOL", side: "short", size: 60, entryPx: 182, valueUsd: 10_700, unrealizedPnl: 570, leverage: 3 },
    { coin: "HYPE", side: "long", size: 300, entryPx: 34.1, valueUsd: 10_500, unrealizedPnl: -210, leverage: 2 },
  ],
};

const polymarket: PolymarketData = {
  name: "fl3x",
  totalValue: 8_420,
  totalPnl: 1_260,
  url: "#",
  positions: [
    { title: "Will SOL close 2026 above $300?", outcome: "Yes", size: 4_000, avgPrice: 0.31, curPrice: 0.44, valueUsd: 1_760, pnl: 520, pnlPct: 41.9, icon: SOL_ICON, url: "#" },
    { title: "Will a memecoin flip $10B market cap this year?", outcome: "No", size: 3_000, avgPrice: 0.58, curPrice: 0.66, valueUsd: 1_980, pnl: 240, pnlPct: 13.8, icon: BONK_ICON, url: "#" },
    { title: "ETH ETF net inflows positive in November?", outcome: "Yes", size: 2_500, avgPrice: 0.62, curPrice: 0.55, valueUsd: 1_375, pnl: -175, pnlPct: -11.3, icon: null, url: "#" },
  ],
};

const tokens: Record<string, TokenData> = {
  sol: { chain: "solana", address: "sol", name: "Solana", symbol: "SOL", priceUsd: 177.2, marketCap: 96_000_000_000, change24h: 4.6, imageUrl: SOL_ICON, url: "#" },
  bonk: { chain: "solana", address: "bonk", name: "Bonk", symbol: "BONK", priceUsd: 0.0000181, marketCap: 1_400_000_000, change24h: -2.4, imageUrl: BONK_ICON, url: "#" },
  wif: { chain: "solana", address: "wif", name: "dogwifhat", symbol: "WIF", priceUsd: 0.1761, marketCap: 175_974_880, change24h: 1.4, imageUrl: WIF_ICON, url: "#" },
  jup: { chain: "solana", address: "jup", name: "Jupiter", symbol: "JUP", priceUsd: 0.2592, marketCap: 860_516_372, change24h: 2.1, imageUrl: JUP_ICON, url: "#" },
  popcat: { chain: "solana", address: "popcat", name: "Popcat", symbol: "POPCAT", priceUsd: 0.04086, marketCap: 40_048_045, change24h: 3.9, imageUrl: POPCAT_ICON, url: "#" },
  fl3x: { chain: "solana", address: "fl3x", name: "FL3X", symbol: "FL3X", priceUsd: 0.0021, marketCap: 2_100_000, change24h: 42, imageUrl: "/images/fl3x-icon.svg", url: "#" },
};

const communities: Record<string, CommunityData> = {
  telegram: { platform: "telegram", name: "FL3X Community", iconUrl: IMG.fl3x, members: 11_972, online: 3_454, url: "https://t.me/fl3xdotlol" },
  discord: { platform: "discord", name: "FL3X Discord", iconUrl: IMG.fl3x, members: 11_972, online: 3_454, url: "https://discord.gg/fl3x" },
};

const media: Record<string, MediaData> = {
  // Real channels, as our API returned them on 2026-10-31 (images copied to /images/demo/real).
  youtube: {
    provider: "youtube",
    title: "Willy Woo’s Bitcoin Model Predicts $413K by 2028",
    author: "Bankless",
    thumbnailUrl: "/images/demo/real/bankless-video.jpg",
    avatarUrl: "/images/demo/real/bankless.jpg",
    publishedAt: "2026-10-30T18:39:28.000Z",
    live: false,
    url: "https://www.youtube.com/@Bankless",
  },
  twitch: {
    provider: "twitch",
    title: "AMP HALLOWEEN PARTY",
    author: "kaicenat",
    thumbnailUrl: "/images/demo/real/kaicenat.png",
    avatarUrl: "/images/demo/real/kaicenat.png",
    live: false,
    url: "https://twitch.tv/kaicenat",
  },
  spotify: {
    provider: "spotify",
    title: "HUMBLE.",
    author: "Kendrick Lamar",
    thumbnailUrl: "/images/demo/real/humble.jpg",
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
    case "trades":
      return trades;
    case "hyperliquid":
      return hyperliquid;
    case "polymarket":
      return polymarket;
    case "portfolio":
      // The calendar reads a month: daily points instead of the hourly ones.
      if (params.period === "1m") return { ...wallet, history: monthly };
      return wallet;
    case "token":
      return tokens[params.address?.replace("demo:", "") ?? ""];
    case "community":
      return params.url?.includes("t.me/") ? communities.telegram : params.url?.includes("discord.gg/") ? communities.discord : undefined;
    case "media":
      // The landing's real song stays fixed: the hero never waits on (or breaks with) the API.
      return params.url === DEMO_TRACK_URL ? media.spotify : media[params.url?.replace("demo:", "") ?? ""];
    case "channel":
      return params.platform === "twitch" ? media.twitch : media.youtube;
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
  { type: "allocation", settings: {} },
  { type: "movers", settings: {} },
  { type: "calendar", settings: { network: "solana" } },
  { type: "trades", settings: {} },
  { type: "watchlist", settings: { chain: "solana", tokens: "demo:sol, demo:jup, demo:wif, demo:popcat" } },
  { type: "hyperliquid", settings: { period: "month" } },
  { type: "polymarket", settings: { user: "demo" } },
  { type: "quote", settings: { quote: "Stay humble. Stack bags. Flex anyway.", author: "FL3X" } },
  { type: "token", settings: { chain: "solana", address: "demo:wif", note: "The hat stays on. Not financial advice." } },
  { type: "community", label: "Telegram", settings: { platform: "telegram", invite: "fl3x" } },
  { type: "community", label: "Discord", settings: { platform: "discord", invite: "fl3x" } },
  { type: "followers", settings: { platform: "x", handle: "fl3xdotlol" } },
  { type: "video", label: "YouTube, latest upload", settings: { platform: "youtube", channel: "Bankless" } },
  { type: "video", label: "Twitch", settings: { platform: "twitch", channel: "kaicenat" } },
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
    username: "fl3x",
    displayName: "FL3X",
    bio: "Your crypto profile, live.",
    avatarUrl: IMG.fl3x,
    badges: BADGES.map((b) => b.id),
    theme: backgroundUrl ? { ...DEFAULT_THEME, background: "image", backgroundUrl } : { ...DEFAULT_THEME, background: "plain" },
    widgets,
    links: [
      { id: "l1", kind: "website", url: "https://fl3x.lol", label: "fl3x.lol" },
      { id: "l2", kind: "discord", url: "https://discord.gg/fl3x", label: null },
      { id: "l3", kind: "x", url: "https://x.com/fl3xdotlol", label: null },
      { id: "l4", kind: "telegram", url: "https://t.me/fl3xdotlol", label: null },
      { id: "l5", kind: "axiom", url: "https://axiom.trade/@bjm", label: null },
      { id: "l6", kind: "gmgn", url: "https://gmgn.ai/r/panzonhl", label: null },
      { id: "l7", kind: "padre", url: "https://trade.padre.gg/rk/alxcooks", label: null },
      { id: "l8", kind: "proxima", url: "https://proxima.tools/@jay", label: null },
    ],
    tier: "premium",
    xHandle: "fl3xdotlol",
    views: 456_432,
  };
}
