// Blog (/blog). Guides people search for, written about what FL3X really does.
// Body blocks are the Help Center's (`HelpBlock`): [label](/href) links and **bold** work inline.
import { TIER_LIMITS } from "@fl3x/shared";
import type { HelpSection } from "@/components/help/content";

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** YYYY-MM-DD */
  date: string;
  tag: string;
  sections: HelpSection[];
}

export const POSTS: BlogPost[] = [
  {
    slug: "how-to-get-a-fl3x-invite-code",
    title: "How to get a FL3X invite code",
    description: "FL3X is invite-only before launch. Here are the ways in: a member's link, a code drop, a giveaway or the waitlist.",
    date: "2026-10-31",
    tag: "Guide",
    sections: [
      {
        id: "why",
        heading: "Why invites",
        blocks: [
          { type: "p", text: "Before launch, claiming a name on FL3X needs an invite. It keeps the first profiles real and gives early members the short handles." },
        ],
      },
      {
        id: "ways",
        heading: "Four ways in",
        blocks: [
          {
            type: "list",
            items: [
              `**A member's link.** Every member has their own link, fl3x.lol/invite/theirname, and up to ${TIER_LIMITS.premium.invites} invites depending on their tier. Opening it fills the invite in for you.`,
              "**Code drops.** We post invite codes on [@fl3xdotlol](https://x.com/fl3xdotlol), a few at a time. They go fast.",
              "**Giveaways.** Some of our posts ask for a Solana address in the replies. Winners get an invite and Premium.",
              "**The waitlist.** Sign in with X at [fl3x.lol/join](/join) without a code and you're on the waitlist. We let people in from it as we go.",
            ],
          },
        ],
      },
      {
        id: "use",
        heading: "Using your code",
        blocks: [
          {
            type: "steps",
            items: [
              "Go to [fl3x.lol/join](/join) and continue with X.",
              "Pick your handle (we prefill it from X) and type the code. It looks like XXXX-XXXX.",
              "Link a wallet if you want to, then open your dashboard.",
            ],
          },
          { type: "note", tone: "info", text: "Codes work once. If yours says it was already used, ask the person who sent it for another one. More in [Invites and waitlist](/help/invites-and-waitlist)." },
        ],
      },
    ],
  },
  {
    slug: "show-your-hyperliquid-pnl",
    title: "How to show your Hyperliquid P&L on your profile",
    description: "Put your perps P&L and open positions from Hyperliquid on a public page, updated on their own.",
    date: "2026-10-31",
    tag: "Guide",
    sections: [
      {
        id: "what",
        heading: "What the widget shows",
        blocks: [
          { type: "p", text: "The **Hyperliquid** widget reads your account from Hyperliquid's public API: account value, P&L over the day, week, month or all time, and your open positions with their side, leverage and unrealized P&L." },
        ],
      },
      {
        id: "steps",
        heading: "Set it up",
        blocks: [
          {
            type: "steps",
            items: [
              "Link the EVM wallet you trade with from **Settings**. It's one free signature.",
              "In **Customize**, add the **Hyperliquid** widget and pick that wallet.",
              "Choose the P&L period, then save.",
            ],
          },
          { type: "note", tone: "info", text: "The widget counts perps only. Spot balances on Hyperliquid aren't part of it." },
        ],
      },
      {
        id: "privacy",
        heading: "Your address stays off the page",
        blocks: [
          { type: "p", text: "Visitors see the numbers. The page fetches them by widget, so the wallet address never reaches it. Pair it with a **P&L Card** for your onchain wallets and your whole trading life is on one link." },
        ],
      },
    ],
  },
  {
    slug: "share-your-polymarket-positions",
    title: "How to share your Polymarket positions",
    description: "Show your open Polymarket bets, their value and your P&L on your profile, with your @username or wallet.",
    date: "2026-10-31",
    tag: "Guide",
    sections: [
      {
        id: "what",
        heading: "What people see",
        blocks: [
          { type: "p", text: "The **Polymarket** widget lists your open positions: the market, your side, what it's worth now and how much it's up or down. The totals sit on top." },
        ],
      },
      {
        id: "steps",
        heading: "Set it up",
        blocks: [
          {
            type: "steps",
            items: [
              "In **Customize**, add the **Polymarket** widget.",
              "Type your Polymarket @username, your 0x address or paste your profile link.",
              "Save. The positions come from Polymarket's public data and refresh on their own.",
            ],
          },
          { type: "note", tone: "info", text: "Polymarket positions are already public on Polymarket. The widget shows what anyone could see there, in one place on your profile." },
        ],
      },
    ],
  },
  {
    slug: "trading-terminal-referral-links",
    title: "Where to put your Axiom, GMGN or Padre referral link",
    description: "Your terminal referral link earns when people trade with it. Put it next to the numbers that make them want to.",
    date: "2026-10-31",
    tag: "Guide",
    sections: [
      {
        id: "why",
        heading: "Put it where the proof is",
        blocks: [
          { type: "p", text: "A referral link in a tweet scrolls away in a day. On your profile, it sits under your P&L, your trades and your holdings: the reasons someone would want to trade like you." },
        ],
      },
      {
        id: "steps",
        heading: "Add it",
        blocks: [
          {
            type: "steps",
            items: [
              "Open **Links** in your dashboard.",
              "Pick the terminal (Axiom, GMGN, Padre, Proxima or FOMO) and type your referral handle or code.",
              "Drag it where you want in the list. Each terminal gets its own mark on your profile.",
            ],
          },
          { type: "p", text: `Free profiles get ${TIER_LIMITS.none.links} links, Premium gets ${TIER_LIMITS.premium.links}.` },
        ],
      },
      {
        id: "analytics",
        heading: "See what gets clicked",
        blocks: [
          { type: "p", text: "Your analytics count clicks on every link, so you can see which terminal your visitors pick." },
        ],
      },
    ],
  },
  {
    slug: "show-your-solana-portfolio-on-your-profile",
    title: "How to show your Solana portfolio on your profile",
    description: "Put your live Solana balance, holdings and P&L on a public profile, without ever sharing your wallet address.",
    date: "2026-10-31",
    tag: "Guide",
    sections: [
      {
        id: "why",
        heading: "Why show it at all",
        blocks: [
          { type: "p", text: "Screenshots of a wallet get old the moment you post them, and anyone can fake one. A live widget reads the chain every time someone opens your page: what people see is what you hold, right now." },
          { type: "p", text: "On FL3X, wallet widgets add up every wallet you have verified. Visitors see the totals, never the addresses behind them." },
        ],
      },
      {
        id: "steps",
        heading: "Set it up in three steps",
        blocks: [
          {
            type: "steps",
            items: [
              "Claim your name at [fl3x.lol/join](/join) and sign in with X.",
              "Link your Solana wallet (Phantom, Solflare, Backpack…) from **Settings**. You sign a one-time message: no transaction, no fees.",
              "Open **Customize** and add a **Portfolio**, **Holdings** or **Allocation** widget. Pick which wallets it counts, then save.",
            ],
          },
          { type: "note", tone: "info", text: "EVM wallets work too (Ethereum, Base, BNB Chain, Arbitrum, Robinhood Chain), and one widget can combine all of them." },
        ],
      },
      {
        id: "which-widget",
        heading: "Which widget to pick",
        blocks: [
          {
            type: "table",
            head: ["Widget", "What it shows"],
            rows: [
              ["Portfolio", "Total value and its chart over the period you choose"],
              ["Holdings", "Your biggest tokens with their value"],
              ["Allocation", "How your portfolio splits between tokens"],
              ["P&L Card", "Profit and loss over 24h, 7d, 30d or all time"],
              ["NFT Gallery", "The NFTs in your Solana wallets"],
            ],
          },
          { type: "p", text: `Free profiles get ${TIER_LIMITS.none.widgets} widgets, Premium gets ${TIER_LIMITS.premium.widgets}. See [all widgets](/help/widgets).` },
        ],
      },
      {
        id: "privacy",
        heading: "Your addresses stay private",
        blocks: [
          { type: "p", text: "Your public page asks FL3X for each widget's values by its id. The wallet addresses never reach the page, so nobody can copy them from the source or look them up on an explorer." },
        ],
      },
    ],
  },
  {
    slug: "track-your-crypto-pnl",
    title: "How to track your crypto P&L (and show it)",
    description: "Follow your profit and loss day by day across Solana and EVM wallets, with a calendar view and a shareable card.",
    date: "2026-10-31",
    tag: "Guide",
    sections: [
      {
        id: "how",
        heading: "How FL3X counts your P&L",
        blocks: [
          { type: "p", text: "When you add a Solana wallet, FL3X rebuilds its value over the past year from the chain, then records it every hour. Your P&L over a period is the change in value between its start and now." },
          { type: "note", tone: "info", text: "No waiting for history to build up: your last 7 days, 30 days or year show as soon as the rebuild is done, usually within a minute. EVM wallets start their history when they're added, for now." },
        ],
      },
      {
        id: "widgets",
        heading: "Three ways to show it",
        blocks: [
          {
            type: "list",
            items: [
              "**P&L Card**: one number in green or red over 24h, 7d, 30d or all time. Pick Solana or EVM wallets.",
              "**P&L Calendar**: every day of the month colored by how it went.",
              "**Best & Worst**: your best and worst tokens over the period.",
            ],
          },
        ],
      },
      {
        id: "traders",
        heading: "For active traders",
        blocks: [
          { type: "p", text: "**Recent Trades** lists your latest swaps on Solana. Trading perps? The **Hyperliquid** widget shows your account's P&L. Betting on events? **Polymarket** shows your open positions." },
          { type: "p", text: "Add your terminal referral link (Axiom, GMGN, Padre, Proxima, FOMO) next to it: people who like your numbers can trade with your link." },
        ],
      },
    ],
  },
  {
    slug: "is-linking-a-wallet-safe",
    title: "Is linking your wallet to a website safe?",
    description: "What signing a message really does, what it can't do, and how to spot a wallet drainer before you click.",
    date: "2026-10-31",
    tag: "Security",
    sections: [
      {
        id: "sign-vs-send",
        heading: "Signing a message is not sending a transaction",
        blocks: [
          { type: "p", text: "To prove a wallet is yours, a site asks you to sign a short text message. Signing it costs nothing, moves nothing and gives no access to your funds. It only proves you hold the key." },
          { type: "p", text: "A transaction is different: it can move tokens or give a contract permission to spend them. Your wallet shows which one you are about to approve. Read it." },
        ],
      },
      {
        id: "red-flags",
        heading: "Red flags",
        blocks: [
          {
            type: "list",
            items: [
              "A \"verification\" that asks you to approve a transaction or pay a fee.",
              "A message full of unreadable characters instead of plain text.",
              "\"Approve\", \"setApprovalForAll\" or \"increase allowance\" on a site that only needed to know your address.",
              "A link sent in DMs, or a domain one letter off the real one.",
            ],
          },
          { type: "note", tone: "warn", text: "Never type your seed phrase on any website. No real service will ever ask for it." },
        ],
      },
      {
        id: "fl3x",
        heading: "How FL3X does it",
        blocks: [
          { type: "p", text: "FL3X only ever asks you to sign a readable message naming FL3X and your wallet, which says signing is free. There is no transaction, no approval and no fee. The details are in [Link a wallet](/help/link-a-wallet)." },
        ],
      },
    ],
  },
  {
    slug: "link-in-bio-for-crypto",
    title: "What a link in bio for crypto should do",
    description: "Lists of links weren't made for on-chain people. Here is what a crypto profile page should show instead.",
    date: "2026-10-31",
    tag: "Opinion",
    sections: [
      {
        id: "problem",
        heading: "A list of links says very little",
        blocks: [
          { type: "p", text: "Most link-in-bio pages are a stack of buttons. For crypto people, the most interesting things are elsewhere: what you hold, what you trade, the communities you run, the token you launched." },
        ],
      },
      {
        id: "what",
        heading: "What it should show",
        blocks: [
          {
            type: "list",
            items: [
              "**Live numbers**: portfolio, P&L, a token's price, read from the chain, not a screenshot.",
              "**Proof**: wallets verified by signature, so the numbers are really yours.",
              "**Your communities**: Discord and Telegram with their member counts.",
              "**Your content**: your latest YouTube video, your Twitch stream, what you're listening to.",
              "**Privacy**: totals on the page, addresses kept out of it.",
            ],
          },
        ],
      },
      {
        id: "fl3x",
        heading: "That's why we built FL3X",
        blocks: [
          { type: "p", text: "FL3X is a profile made of live widgets, at fl3x.lol/@you. It's free to start, and holding $FL3X unlocks more. Compare it with [Linktree](/vs/linktree) or [Carrd](/vs/carrd), or [see the tiers](/token)." },
        ],
      },
    ],
  },
];

export const findPost = (slug: string) => POSTS.find((p) => p.slug === slug);
