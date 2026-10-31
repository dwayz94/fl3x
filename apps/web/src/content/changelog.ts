// Public changelog (/changelog): what changed for members, newest first.
// Add an entry when a feature ships; keep internal work (deploys, tooling) out.

export interface ChangelogEntry {
  /** YYYY-MM-DD */
  date: string;
  title: string;
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: "2026-10-31",
    title: "Your name, your way",
    items: [
      "Names and bios keep the capitals you type.",
      "The Premium page is now called Plan.",
      "New pages: Explore, About, Token, Changelog and the Blog.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Eight new widgets",
    items: [
      "Allocation, Best & Worst, P&L Calendar and Recent Trades, built from your verified wallets.",
      "Watchlist, Hyperliquid, Polymarket and Quote.",
      "P&L cards pick Solana or EVM wallets.",
      "Premium widgets can switch from Glass to a Color background.",
      "Saving waits until every widget has what it needs, and shows you which one is missing something.",
    ],
  },
  {
    date: "2026-10-30",
    title: "Video backgrounds and a better wallet flow",
    items: [
      "Premium profiles can use a video or GIF background (up to 30 seconds).",
      "A new modal to link EVM and Solana wallets, from Settings, the join flow or a wallet widget.",
      "Your X profile picture becomes your avatar until you pick another one.",
      "Clocks: pick a country, then a city. The time zone follows.",
      "NFT Gallery widget, a Download card button and referral reward badges.",
      "A Help Center with guides for every part of FL3X.",
    ],
  },
  {
    date: "2026-10-29",
    title: "Live data everywhere",
    items: [
      "Real follower counts for X, YouTube, Twitch and TikTok.",
      "Share images for every profile.",
      "Animated backgrounds for Premium.",
      "Links reorder by drag, and terminal referral links (Axiom, GMGN, Padre, Proxima, FOMO) get their own marks.",
      "Robinhood Chain wallets and tokens.",
      "Sign in with X goes straight to X.",
    ],
  },
  {
    date: "2026-10-28",
    title: "FL3X is born",
    items: [
      "Profiles at fl3x.lol/@you with live widgets: wallets, tokens, music, videos, communities.",
      "Free, Starter and Premium tiers, unlocked by holding $FL3X.",
      "Analytics for your profile: views, clicks, countries, devices.",
    ],
  },
];
