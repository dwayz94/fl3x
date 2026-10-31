// Help Center content (/help). Only describe what the product really does:
// numbers come from @fl3x/shared so they follow the code. Inline text accepts
// [label](/href) links and **bold**.
import {
  Analytics02Icon,
  Award01Icon,
  ChartLineData01Icon,
  Crown02Icon,
  Delete02Icon,
  GridViewIcon,
  HelpCircleIcon,
  Link01Icon,
  Login01Icon,
  PaintBoardIcon,
  PaintBucketIcon,
  SecurityLockIcon,
  Settings02Icon,
  SparklesIcon,
  Ticket01Icon,
  UserAdd01Icon,
  UserCircleIcon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import {
  BACKGROUNDS, BADGES, CURSORS, FONTS, MAX_BACKGROUND_VIDEO_BYTES, MAX_BACKGROUND_VIDEO_SECONDS, PERIODS, TIER_LIMITS, USERNAME_MAX, USERNAME_MIN,
} from "@fl3x/shared";

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "note"; tone: "info" | "warn"; text: string }
  | { type: "table"; head: string[]; rows: string[][] }
  /** Monospace block, e.g. the message a wallet signs. */
  | { type: "code"; text: string }
  /** Free / Starter / Premium side by side, with the live thresholds. */
  | { type: "tiers" }
  /** Every widget in the library, from the shared catalogue. */
  | { type: "widgets" }
  /** Every link type, from LINK_KINDS. */
  | { type: "links" }
  /** Every badge, with its icon and how to earn it. */
  | { type: "badges" };

export interface HelpSection {
  id: string;
  heading: string;
  blocks: HelpBlock[];
}

export interface HelpPage {
  slug: string;
  icon: IconSvgElement;
  title: string;
  description: string;
  sections: HelpSection[];
}

export interface HelpGroup {
  title: string;
  pages: HelpPage[];
}

const free = TIER_LIMITS.none;
const starter = TIER_LIMITS.starter;
const premium = TIER_LIMITS.premium;
/** Badges unlocked by referral milestones, lowest first. */
const referralRewards = BADGES.flatMap((b) => (b.unlock.kind === "referrals" ? [{ name: b.name, count: b.unlock.count }] : [])).sort((a, b) => a.count - b.count);
const label = (ids: readonly { label: string }[]) => ids.map((x) => x.label).join(", ");
const plainBackgrounds = BACKGROUNDS.filter((b) => !("animated" in b) && b.id !== "image" && b.id !== "video");
const animatedBackgrounds = BACKGROUNDS.filter((b) => "animated" in b);

export const HELP_GROUPS: HelpGroup[] = [
  {
    title: "Getting started",
    pages: [
      {
        slug: "what-is-fl3x",
        icon: SparklesIcon,
        title: "What is FL3X",
        description: "One page for everything you do on-chain and online, with widgets that stay up to date on their own.",
        sections: [
          {
            id: "overview",
            heading: "Your profile, live",
            blocks: [
              {
                type: "p",
                text: "FL3X gives you a public profile at fl3x.lol/@yourname. On it you put a card with your name, bio and avatar, the links you care about, and widgets that show real, live data: your wallets, a token you like, your community, your music, your latest video and more.",
              },
              {
                type: "p",
                text: "Nothing on a profile is typed in by hand when it can be read from the source. Follower counts come from the platform, wallet values from the chain, member counts from Discord or Telegram.",
              },
            ],
          },
          {
            id: "what-you-can-add",
            heading: "What you can add",
            blocks: [
              {
                type: "list",
                items: [
                  "**Widgets**: wallet P&L, portfolio and holdings, NFTs, tokens, communities, followers, videos, music, a clock, a countdown, images, text and link cards. See [Widgets](/help/widgets).",
                  "**Links**: the icons under your card, for X, Discord, Telegram, YouTube, trading terminal referrals and more. See [Links](/help/links).",
                  "**Style**: accent color, backgrounds, your own images, and Premium fonts, cursors and animated backgrounds. See [Look and feel](/help/look-and-feel).",
                  "**Badges**: earned by being early, inviting people or holding $FL3X. See [Badges](/help/badges).",
                ],
              },
            ],
          },
          {
            id: "price",
            heading: "Is it free?",
            blocks: [
              {
                type: "p",
                text: `Yes. Every member gets a profile with ${free.widgets} widgets and ${free.links} links, no token needed. Holding $FL3X in a linked Solana wallet unlocks Starter or Premium, with more room and extra options. There is no subscription: your tier follows what you hold. See [Tiers](/help/tiers).`,
              },
            ],
          },
          {
            id: "safety",
            heading: "Your funds stay yours",
            blocks: [
              {
                type: "p",
                text: "FL3X never holds your funds and never asks you to send a transaction. Linking a wallet only asks you to sign a short message that proves it is yours. We will never ask for a private key or a seed phrase: anyone who does is not us.",
              },
            ],
          },
        ],
      },
      {
        slug: "claim-your-name",
        icon: UserAdd01Icon,
        title: "Claim your name",
        description: "Create your account with X and pick the handle your profile lives at.",
        sections: [
          {
            id: "steps",
            heading: "Create your account",
            blocks: [
              { type: "p", text: "Go to [Join](/join). It takes four short steps:" },
              {
                type: "steps",
                items: [
                  "**Continue with X.** You approve FL3X on X and come back. There is no email and no password.",
                  "**Pick your handle.** We prefill it from your X handle: keep it or choose another. While FL3X is invite-only, you also enter your invite code here.",
                  "**Link your wallets.** Optional, and you can do it later in Settings.",
                  "**You're in.** Your page is live: open your dashboard to add widgets and links.",
                ],
              },
            ],
          },
          {
            id: "rules",
            heading: "Handle rules",
            blocks: [
              {
                type: "list",
                items: [
                  `${USERNAME_MIN} to ${USERNAME_MAX} characters: letters, numbers, _ and -.`,
                  "Starts with a letter, doesn't end with _ or -, and never has two of them in a row.",
                  "Some names are reserved for FL3X itself (like admin, support or help).",
                  "Handles are first come, first served. The form tells you right away if one is taken.",
                ],
              },
              { type: "note", tone: "info", text: "Handles can't be changed from the dashboard, so pick the one you want to keep." },
            ],
          },
          {
            id: "your-link",
            heading: "Your link",
            blocks: [
              {
                type: "p",
                text: "Your profile lives at fl3x.lol/@yourhandle. You can copy it from [Settings](/dashboard/settings) and put it in your X bio, your Discord or anywhere else.",
              },
            ],
          },
        ],
      },
      {
        slug: "invites-and-waitlist",
        icon: Ticket01Icon,
        title: "Invites and waitlist",
        description: "How to get in while FL3X is invite-only, and how the waitlist works.",
        sections: [
          {
            id: "invite-only",
            heading: "Invite-only for now",
            blocks: [
              {
                type: "p",
                text: "During pre-launch, claiming a handle needs an invite. Every member has their own invite link and can bring a limited number of people in. Everyone else can join the waitlist.",
              },
            ],
          },
          {
            id: "invite",
            heading: "Using an invite",
            blocks: [
              {
                type: "list",
                items: [
                  "**Invite link**: fl3x.lol/invite/theirhandle. Opening it takes you to Join with the invite already filled in.",
                  "**Invite code**: eight characters, like ABCD-EFGH. Type it on the handle step of [Join](/join).",
                ],
              },
              {
                type: "p",
                text: "If a code is refused, it was mistyped or its member has no invites left. Ask them for a fresh link, or join the waitlist.",
              },
            ],
          },
          {
            id: "waitlist",
            heading: "The waitlist",
            blocks: [
              {
                type: "p",
                text: "There's no form: sign in with X on [Join](/join) without an invite and you're in line. We DM you on X when a spot opens, so keep your DMs reachable. If a friend invites you in the meantime, use their link and skip the line.",
              },
            ],
          },
          {
            id: "after-launch",
            heading: "After launch",
            blocks: [
              {
                type: "p",
                text: "Once FL3X opens to everyone, no invite is needed. Invite links and codes keep working: they still credit the member who brought you. See [Referrals](/help/referrals).",
              },
            ],
          },
        ],
      },
      {
        slug: "signing-in",
        icon: Login01Icon,
        title: "Signing in",
        description: "How you sign in to FL3X, and what we can and can't do with your X account.",
        sections: [
          {
            id: "with-x",
            heading: "Sign in with X",
            blocks: [
              {
                type: "p",
                text: "You sign in with your X account: use Get Started or Dashboard in the top bar, or go to [Join](/join). If you already have a profile you land on your dashboard. Sign-in is handled by Privy; FL3X never sees your X password.",
              },
              {
                type: "p",
                text: "We read your public X profile to prefill your handle and avatar and to reach you about the waitlist. We never post for you.",
              },
            ],
          },
          {
            id: "wallets",
            heading: "Wallets are separate",
            blocks: [
              {
                type: "p",
                text: "Wallets don't replace X. You link them from Settings to power your wallet widgets and your tier, and you can link or remove them at any time. See [Link a wallet](/help/link-a-wallet).",
              },
            ],
          },
          {
            id: "log-out",
            heading: "Log out",
            blocks: [{ type: "p", text: "Use **Log out** at the bottom of [Settings](/dashboard/settings)." }],
          },
          {
            id: "lost-access",
            heading: "Lost access to your X account?",
            blocks: [
              {
                type: "p",
                text: "Write to [support@fl3x.lol](mailto:support@fl3x.lol) with your FL3X handle. We can find your account by handle, X handle or linked wallet.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Your profile",
    pages: [
      {
        slug: "customize",
        icon: PaintBoardIcon,
        title: "Customize your profile",
        description: "The editor: add and arrange widgets, edit your card in place, and save.",
        sections: [
          {
            id: "open",
            heading: "Open the editor",
            blocks: [
              {
                type: "p",
                text: "Open [Customize](/dashboard/customize) from your dashboard. It takes the whole screen: your card in the middle, the library on the left, and the settings of the selected widget on the right. When you visit your own public profile while signed in, an **Edit profile** button takes you straight there.",
              },
            ],
          },
          {
            id: "card",
            heading: "Edit your card in place",
            blocks: [
              {
                type: "list",
                items: [
                  "Click your **name** or **bio** on the card and type.",
                  "Click your **avatar** to upload a new one.",
                  "You can also change all three in [Settings](/dashboard/settings).",
                ],
              },
            ],
          },
          {
            id: "widgets",
            heading: "Add and arrange widgets",
            blocks: [
              {
                type: "list",
                items: [
                  "Click a widget in the library to add it at the end of your card, or drag its tile onto the card where you want it.",
                  "Click a widget on the card to edit its content, size and style.",
                  "Drag a widget to move it: the others make room as you go. On a phone, hold it first.",
                ],
              },
            ],
          },
          {
            id: "save",
            heading: "Save your changes",
            blocks: [
              {
                type: "p",
                text: "Changes show up on the card right away but are not public yet. A bar at the bottom of the screen appears as soon as something changed: **Save changes** publishes it, **Discard** goes back to your saved profile.",
              },
              { type: "note", tone: "info", text: "A new avatar is saved as soon as it's uploaded." },
            ],
          },
        ],
      },
      {
        slug: "widgets",
        icon: GridViewIcon,
        title: "Widgets",
        description: "Every widget you can add to your profile, and how many your tier allows.",
        sections: [
          {
            id: "library",
            heading: "The library",
            blocks: [
              {
                type: "p",
                text: "Widgets are live cards on your profile. Data comes from the source (chains, X, YouTube, Discord…) and refreshes on its own: you never type a number in.",
              },
              { type: "widgets" },
            ],
          },
          {
            id: "sizes",
            heading: "Sizes",
            blocks: [
              {
                type: "p",
                text: "Every widget comes in two sizes: a **long card** (wide and short) or a **large card** (square). Pick one in the widget's settings; your card grows to fit.",
              },
            ],
          },
          {
            id: "wallet-widgets",
            heading: "Wallet widgets",
            blocks: [
              {
                type: "p",
                text: "P&L, Portfolio and Holdings need at least one linked wallet. By default they add up every wallet you linked; you can pick specific ones in the widget's settings. The P&L card shows one network at a time: pick **Solana** or **EVM** (Ethereum, Base, BNB Chain, Arbitrum, Robinhood Chain) and it counts only those wallets. Addresses never appear on your profile. See [Wallet privacy](/help/wallet-privacy).",
              },
              {
                type: "p",
                text: "**NFT Gallery** shows NFTs from your linked **Solana** wallets (EVM NFTs aren't supported yet, and compressed NFTs are skipped), with the total count. The large card shows a 2×2 grid, the long card a row of 4.",
              },
              {
                type: "list",
                items: [
                  "**Allocation**: how your wallets split between your three biggest bags and the rest.",
                  "**Best & Worst**: the bag that gained and the one that lost the most dollars over the last 24 hours.",
                  "**P&L Calendar**: one square per day for the last month, green when your wallets went up, red when they went down (Solana or EVM, like the P&L card). It fills in as hourly history builds up.",
                  "**Recent Trades**: your last swaps on Solana (bought or sold, for how much SOL or USDC, how long ago).",
                  "**Hyperliquid**: the perps P&L of your linked EVM wallets over 24h, 7d, 30d or all time, your account value and open positions.",
                ],
              },
            ],
          },
          {
            id: "market-widgets",
            heading: "Market widgets",
            blocks: [
              {
                type: "list",
                items: [
                  "**Watchlist**: up to 4 tokens (paste their addresses, separated by commas) with their live price and 24h change.",
                  "**Polymarket**: the open bets of a Polymarket profile. Enter your @username, your Polymarket wallet (0x…) or your profile link.",
                  "**Quote**: a line you live by, set big, with who said it.",
                ],
              },
            ],
          },
          {
            id: "music",
            heading: "Music",
            blocks: [
              {
                type: "list",
                items: [
                  "**Currently listening**: shows the track you're playing, or the last one you played. Connect Spotify in [Settings](/dashboard/settings) under Connections.",
                  "**A track**: paste a Spotify track link (open.spotify.com/track/…) to show that track.",
                  "Visitors can play a 30-second preview when one is available.",
                ],
              },
            ],
          },
          {
            id: "widget-look",
            heading: "Widget backgrounds and finishing a widget",
            blocks: [
              {
                type: "list",
                items: [
                  "**Glass** is every widget's default background. **Color** (Premium) gives a widget a color of your choice, set per widget in its settings.",
                  "Some widgets need something before they can go live (a token address, an image, a link…). Until it's filled in, the widget is outlined in orange and **Save changes** waits: the bar tells you what's missing and **Show me** opens it.",
                ],
              },
            ],
          },
          {
            id: "limits",
            heading: "How many widgets",
            blocks: [
              {
                type: "table",
                head: ["Free", "Starter", "Premium"],
                rows: [[`${free.widgets} widgets`, `${starter.widgets} widgets`, `${premium.widgets} widgets`]],
              },
              {
                type: "p",
                text: "If your tier drops below the number of widgets you have, nothing is removed: you can still edit, move and delete them, you just can't add new ones until you're back under the limit.",
              },
            ],
          },
        ],
      },
      {
        slug: "links",
        icon: Link01Icon,
        title: "Links",
        description: "The icons under your card: which sites you can add, and how to order them.",
        sections: [
          {
            id: "add",
            heading: "Add a link",
            blocks: [
              {
                type: "steps",
                items: [
                  "Open [Links](/dashboard/links) in your dashboard.",
                  "Pick a network.",
                  "Type your handle. The address around it is fixed, so a link can only point where its icon says. Pasting a full link works too: we keep the handle part.",
                  "Add a label if you want one, then save.",
                ],
              },
            ],
          },
          {
            id: "types",
            heading: "Link types",
            blocks: [
              { type: "links" },
              {
                type: "p",
                text: "Axiom, GMGN, Padre, Proxima and FOMO take your referral code, so visitors sign up with your link. **Website** and **Custom** take any address of your own.",
              },
            ],
          },
          {
            id: "order",
            heading: "Change the order",
            blocks: [{ type: "p", text: "Drag a link, or use the up and down arrows, on the Links page. Your profile shows them in that order." }],
          },
          {
            id: "limits",
            heading: "How many links",
            blocks: [
              {
                type: "table",
                head: ["Free", "Starter", "Premium"],
                rows: [[`${free.links} links`, `${starter.links} links`, `${premium.links} links`]],
              },
            ],
          },
        ],
      },
      {
        slug: "look-and-feel",
        icon: PaintBucketIcon,
        title: "Look and feel",
        description: "Accent color, backgrounds, images, fonts, cursors and the FL3X mark.",
        sections: [
          {
            id: "color",
            heading: "Accent color",
            blocks: [{ type: "p", text: "Pick any color in Customize under **Color**. It tints your profile." }],
          },
          {
            id: "background",
            heading: "Background",
            blocks: [
              {
                type: "list",
                items: [
                  `**Colors**: ${label(plainBackgrounds)}.`,
                  "**Image**: upload your own, or use one of the FL3X images.",
                  `**Animated** (Premium): ${label(animatedBackgrounds)}.`,
                  `**Video or GIF** (Premium): upload an MP4 (H.264), WebM or GIF loop up to ${MAX_BACKGROUND_VIDEO_SECONDS} seconds and ${MAX_BACKGROUND_VIDEO_BYTES / 1024 / 1024} MB. It plays muted, and stays on a still frame for visitors who turned off animations.`,
                ],
              },
            ],
          },
          {
            id: "images",
            heading: "Avatar and images",
            blocks: [
              {
                type: "p",
                text: "Avatars, backgrounds and image widgets accept PNG, JPG and WebP files up to 8 MB. We convert them to WebP so your profile loads fast.",
              },
            ],
          },
          {
            id: "premium",
            heading: "Premium options",
            blocks: [
              {
                type: "list",
                items: [
                  `**Font** for your name: ${label(FONTS)}.`,
                  `**Cursor** for your visitors: ${label(CURSORS.filter((c) => c.id !== "default"))}.`,
                  "**Animated backgrounds**, and your own video or GIF as a background.",
                  "**Branding**: hide the small FL3X mark under your card.",
                ],
              },
              {
                type: "note",
                tone: "info",
                text: "These show on your profile only while you're Premium. If your tier drops, your profile goes back to the standard font, cursor and background.",
              },
            ],
          },
        ],
      },
      {
        slug: "badges",
        icon: Award01Icon,
        title: "Badges",
        description: "What each badge means, how to earn it, and how to choose which ones you show.",
        sections: [
          {
            id: "all",
            heading: "All badges",
            blocks: [{ type: "badges" }],
          },
          {
            id: "show",
            heading: "Show or hide",
            blocks: [
              {
                type: "p",
                text: "Open [Badges](/dashboard/badges) and click a badge you own to show or hide it on your profile. Visitors can hover or tap a badge to see what it means.",
              },
            ],
          },
          {
            id: "checkmark",
            heading: "The checkmark",
            blocks: [{ type: "p", text: "The checkmark next to a name is for Premium members. It goes away if the tier drops." }],
          },
        ],
      },
    ],
  },
  {
    title: "Wallets",
    pages: [
      {
        slug: "link-a-wallet",
        icon: Wallet01Icon,
        title: "Link a wallet",
        description: "Prove a wallet is yours with a free signature. No transaction, no access to your funds.",
        sections: [
          {
            id: "how",
            heading: "How to link one",
            blocks: [
              {
                type: "steps",
                items: [
                  "Open [Settings](/dashboard/settings) and click **Link a wallet** (or do it during Join).",
                  "Pick your wallet. FL3X lists the wallet extensions installed in your browser: Phantom, Solflare, Backpack, MetaMask, Rabby and others.",
                  "Approve the connection, then sign the message.",
                ],
              },
            ],
          },
          {
            id: "message",
            heading: "What you sign",
            blocks: [
              { type: "p", text: "The message is plain text and looks like this:" },
              {
                type: "code",
                text: "FL3X wants to check that you own this wallet.\n\nWallet: <your address>\nNonce: <random code>\nExpires: <date>\n\nSigning is free. It does not send a transaction and gives FL3X no access to your funds.",
              },
              {
                type: "note",
                tone: "warn",
                text: "If your wallet asks you to approve a transaction, a token spend or a payment, it is not FL3X. Reject it.",
              },
            ],
          },
          {
            id: "chains",
            heading: "Supported wallets",
            blocks: [
              {
                type: "list",
                items: [
                  "**Solana** wallets.",
                  "**EVM** wallets (one address covers Ethereum, Base, Arbitrum, Optimism, BNB Chain, Polygon and Robinhood Chain).",
                  "Up to 10 wallets per account. Each wallet can be linked to one FL3X account only.",
                ],
              },
            ],
          },
          {
            id: "remove",
            heading: "Remove a wallet",
            blocks: [
              {
                type: "p",
                text: "Remove it from the Wallets list in [Settings](/dashboard/settings). Your widgets stop counting it and your tier is checked again right away.",
              },
            ],
          },
        ],
      },
      {
        slug: "wallet-privacy",
        icon: SecurityLockIcon,
        title: "Wallet privacy",
        description: "What visitors see from your wallets, and what they never see.",
        sections: [
          {
            id: "addresses",
            heading: "Addresses stay private",
            blocks: [
              {
                type: "p",
                text: "Your wallet addresses are never shown on your public profile and never sent to visitors' browsers. A wallet widget asks FL3X for its numbers, and FL3X answers with values only.",
              },
            ],
          },
          {
            id: "visible",
            heading: "What visitors see",
            blocks: [
              {
                type: "list",
                items: [
                  "**P&L**: how much the value went up or down over the period you chose.",
                  "**Portfolio**: the total value and its chart.",
                  "**Holdings**: the total value and your biggest positions (token, amount and value).",
                  "**NFT Gallery**: NFTs from the Solana wallets you picked, and how many there are.",
                ],
              },
              {
                type: "p",
                text: "Only wallets you add to a wallet widget are shown. If you don't want a wallet on your profile, leave it out of the widget's wallet list, or don't add a wallet widget at all.",
              },
            ],
          },
          {
            id: "public-data",
            heading: "A word on public data",
            blocks: [
              {
                type: "p",
                text: "Blockchains are public. FL3X doesn't show your address, but someone who already knows it can look it up on an explorer. If a position is easy to recognise, keep that in mind before showing it.",
              },
            ],
          },
        ],
      },
      {
        slug: "portfolio-and-pnl",
        icon: ChartLineData01Icon,
        title: "Portfolio and P&L",
        description: "Where the numbers come from, and why history starts when you add a widget.",
        sections: [
          {
            id: "snapshots",
            heading: "Hourly snapshots",
            blocks: [
              {
                type: "p",
                text: "Every hour, FL3X records the value of each wallet shown in a P&L, Portfolio or Holdings widget. Charts and P&L are built from these snapshots, plus the live value right now.",
              },
              {
                type: "note",
                tone: "info",
                text: "History starts the first time a wallet is shown in one of these widgets. A wallet you just added has no past yet: give it a few hours, and the longer periods fill in over time.",
              },
            ],
          },
          {
            id: "pnl",
            heading: "How P&L is calculated",
            blocks: [
              {
                type: "code",
                text: "P&L = value now − value at the start of the period",
              },
              {
                type: "p",
                text: `Periods: ${PERIODS.map((p) => p.label).join(", ")}. If history doesn't go back that far yet, the start is the oldest snapshot we have.`,
              },
              {
                type: "p",
                text: "It is the change in wallet value, not trading profit: sending funds in or out of a wallet moves the number too.",
              },
            ],
          },
          {
            id: "prices",
            heading: "Where prices come from",
            blocks: [
              {
                type: "list",
                items: [
                  "**Solana**: balances read from the chain, priced with Jupiter.",
                  "**EVM chains**: balances read from public RPC nodes, priced with DefiLlama.",
                  "**Robinhood Chain**: ETH and WETH only for now; other tokens there have no price feed yet.",
                  "When the same token sits in several wallets, it shows as one holding.",
                ],
              },
              {
                type: "p",
                text: "If a source is briefly down, a wallet counts with its last known value rather than zero, so a hiccup never shows as a loss.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Tiers and $FL3X",
    pages: [
      {
        slug: "tiers",
        icon: Crown02Icon,
        title: "Tiers",
        description: "Free, Starter and Premium: what each tier gets and how holding $FL3X unlocks them.",
        sections: [
          {
            id: "compare",
            heading: "Free, Starter, Premium",
            blocks: [
              { type: "tiers" },
              { type: "note", tone: "info", text: "Amounts are provisional and may change before and after the token launch." },
            ],
          },
          {
            id: "how",
            heading: "How your tier is set",
            blocks: [
              {
                type: "list",
                items: [
                  "Your tier follows the $FL3X held across all the **Solana** wallets you linked. $FL3X is a Solana token, so EVM wallets don't count.",
                  "Holdings are checked again every 5 minutes, and right away when you link or remove a wallet.",
                  "Bought more? Use the refresh button on the [Plan](/dashboard/plan) page.",
                  "There's no subscription and nothing to pay FL3X. Sell or move the tokens and your tier follows within minutes.",
                ],
              },
            ],
          },
          {
            id: "drop",
            heading: "If your tier drops",
            blocks: [
              {
                type: "list",
                items: [
                  "Widgets and links above the new limit stay; you just can't add more until you're under it.",
                  "Premium fonts, cursors, animated backgrounds and the hidden FL3X mark switch back to the standard ones. The checkmark goes away.",
                  "Analytics show the shorter history of your new tier.",
                ],
              },
            ],
          },
          {
            id: "token",
            heading: "Getting $FL3X",
            blocks: [
              {
                type: "p",
                text: "When the token is live, the [Plan](/dashboard/plan) page shows a Buy button with the official token. Always check the token address against FL3X's official accounts before buying.",
              },
              {
                type: "note",
                tone: "warn",
                text: "A tier is a product feature, not an investment or a promise of value. Crypto is risky: never buy more than you can afford to lose.",
              },
            ],
          },
        ],
      },
      {
        slug: "referrals",
        icon: UserCircleIcon,
        title: "Referrals",
        description: "Your referral link, invites during pre-launch, the leaderboard and referral rewards.",
        sections: [
          {
            id: "link",
            heading: "Your referral link",
            blocks: [
              {
                type: "p",
                text: "Your link is fl3x.lol/invite/yourhandle: your handle is the link, no code to remember. Find it on the [Referral](/dashboard/referral) page, with a button to share it on X. Your invite code still works too.",
              },
            ],
          },
          {
            id: "invites",
            heading: "Invites during pre-launch",
            blocks: [
              {
                type: "p",
                text: "While FL3X is invite-only, each member can bring in a limited number of people. The Referral page shows how many invites you have left.",
              },
              {
                type: "table",
                head: ["Free", "Starter", "Premium"],
                rows: [[`${free.invites} invites`, `${starter.invites} invites`, `${premium.invites} invites`]],
              },
              { type: "p", text: "If your tier changes, your invites follow. Invites you already used are never taken back." },
            ],
          },
          {
            id: "leaderboard",
            heading: "Leaderboard and crew",
            blocks: [
              {
                type: "p",
                text: "Every member who joins with your link or code counts. The Referral page shows your rank on the leaderboard, how many more you need to pass the next member, and **Your crew**: everyone you brought in.",
              },
              ],
          },
          {
            id: "rewards",
            heading: "Rewards",
            blocks: [
              {
                type: "p",
                text: `Each referral milestone unlocks a badge: ${referralRewards.map((r) => `**${r.name}** at ${r.count}`).join(", ")}. The Rewards section of the Referral page shows your progress toward each one.`,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Analytics",
    pages: [
      {
        slug: "analytics",
        icon: Analytics02Icon,
        title: "Analytics",
        description: "Views, visitors, clicks, countries, devices and sources: what's counted and how.",
        sections: [
          {
            id: "numbers",
            heading: "What you see",
            blocks: [
              {
                type: "list",
                items: [
                  "**Total views** and **unique visitors** over the period, with a daily chart.",
                  "**Live now**: visitors in the last 5 minutes.",
                  "**Link clicks** and your most clicked links.",
                  "**Geography**, **visitor devices** (desktop, mobile, tablet) and **where visitors come from** (X, Telegram, Discord, YouTube, Google, other sites, or direct).",
                ],
              },
            ],
          },
          {
            id: "counting",
            heading: "How views are counted",
            blocks: [
              {
                type: "list",
                items: [
                  "One view per visitor per profile per day. Refreshing the page doesn't add views.",
                  "Bots and link previews (when your link is pasted in a chat or on X) are ignored.",
                  "The view count shown on your profile uses the same rules.",
                ],
              },
            ],
          },
          {
            id: "history",
            heading: "How far back",
            blocks: [
              {
                type: "table",
                head: ["Free", "Starter", "Premium"],
                rows: [[`${free.analyticsDays} days`, `${starter.analyticsDays} days`, `${premium.analyticsDays} days`]],
              },
            ],
          },
          {
            id: "privacy",
            heading: "Visitor privacy",
            blocks: [
              {
                type: "p",
                text: "To count unique visitors without tracking people, we mix the visitor's IP address with a secret that changes every day and keep only the result. IP addresses are never stored, and nobody, us included, can tell who visited your profile.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Account",
    pages: [
      {
        slug: "settings",
        icon: Settings02Icon,
        title: "Settings",
        description: "Your name, bio and avatar, wallets, connected accounts and log out.",
        sections: [
          {
            id: "profile",
            heading: "Profile",
            blocks: [
              {
                type: "list",
                items: [
                  "**Avatar**: click it to upload a new one. Saved right away.",
                  "**Display name**: up to 32 characters. Your handle shows when it's empty.",
                  "**Bio**: up to 160 characters.",
                  "**Your profile**: your public link, ready to copy, and **Download card**: your profile's share card as a PNG image, ready to post on X.",
                ],
              },
              { type: "p", text: "Name and bio changes are saved with **Save changes** in the bar at the bottom." },
            ],
          },
          {
            id: "wallets",
            heading: "Wallets",
            blocks: [{ type: "p", text: "Link and remove wallets. See [Link a wallet](/help/link-a-wallet)." }],
          },
          {
            id: "connections",
            heading: "Connections",
            blocks: [
              {
                type: "p",
                text: "Connect Spotify so your music widget shows what you're listening to. You can disconnect it at any time.",
              },
            ],
          },
          {
            id: "account",
            heading: "Account",
            blocks: [
              {
                type: "p",
                text: "Shows the X account you sign in with (with a **Link X** button if none is linked), **Log out**, and **Delete account**.",
              },
            ],
          },
        ],
      },
      {
        slug: "delete-account",
        icon: Delete02Icon,
        title: "Delete your account",
        description: "What gets deleted, and how to do it.",
        sections: [
          {
            id: "how",
            heading: "How",
            blocks: [
              {
                type: "steps",
                items: [
                  "Open [Settings](/dashboard/settings).",
                  "Click **Delete account**, next to the X account you sign in with.",
                  "Type your handle to confirm, then **Delete forever**.",
                ],
              },
            ],
          },
          {
            id: "what",
            heading: "What is deleted",
            blocks: [
              {
                type: "p",
                text: "Your profile, widgets, links, linked wallets and their value history, uploaded images, connected accounts and analytics. If you were on the waitlist, that entry goes too.",
              },
              {
                type: "note",
                tone: "warn",
                text: "This can't be undone. Your handle becomes free and anyone can claim it.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: "Help",
    pages: [
      {
        slug: "faq",
        icon: HelpCircleIcon,
        title: "FAQ and troubleshooting",
        description: "Quick answers when something doesn't work as expected.",
        sections: [
          {
            id: "no-wallet",
            heading: "“No wallet extension found”",
            blocks: [
              {
                type: "p",
                text: "Linking works with wallet browser extensions. Install one (Phantom, Solflare, Backpack, MetaMask, Rabby…), unlock it, and reload the page.",
              },
            ],
          },
          {
            id: "signature",
            heading: "The signature failed or expired",
            blocks: [
              {
                type: "p",
                text: "A signature request is valid for 10 minutes. If the wallet didn't answer, unlock it and try again. If you cancelled in the wallet, just start over.",
              },
            ],
          },
          {
            id: "wallet-taken",
            heading: "“This wallet is linked to another FL3X account”",
            blocks: [
              {
                type: "p",
                text: "A wallet can belong to one account only, so the same tokens can't unlock two tiers. Remove it from the other account first, or write to support if you no longer have access to it.",
              },
            ],
          },
          {
            id: "tier",
            heading: "My tier didn't change",
            blocks: [
              {
                type: "list",
                items: [
                  "Check the tokens are in a **Solana** wallet linked in Settings.",
                  "Press refresh on the [Plan](/dashboard/plan) page. Otherwise it updates on its own within 5 minutes.",
                ],
              },
            ],
          },
          {
            id: "pnl-empty",
            heading: "My P&L or chart is empty",
            blocks: [
              {
                type: "p",
                text: "History starts when a wallet first appears in a wallet widget, and snapshots are hourly. Come back in a few hours. See [Portfolio and P&L](/help/portfolio-and-pnl).",
              },
            ],
          },
          {
            id: "wallet-widget",
            heading: "I can't save: “Link a wallet first”",
            blocks: [
              {
                type: "p",
                text: "Wallet widgets (P&L, Portfolio, Holdings, NFTs, Recent Trades, Hyperliquid…) need at least one linked wallet of the right kind: Solana for Recent Trades, EVM for Hyperliquid. Link one from the widget's panel in Customize or in [Settings](/dashboard/settings). Until then the profile can't be saved, and a wallet widget left without a wallet is hidden from your public page.",
              },
            ],
          },
          {
            id: "limit",
            heading: "I can't add another widget or link",
            blocks: [
              {
                type: "p",
                text: "You reached your tier's limit. Remove one, or unlock more room by holding $FL3X. See [Tiers](/help/tiers).",
              },
            ],
          },
          {
            id: "followers",
            heading: "Can I show my Instagram followers?",
            blocks: [
              {
                type: "p",
                text: "Not yet: there's no free way to read them. The Followers widget works with X, YouTube, Twitch and TikTok. You can still add Instagram as a link.",
              },
            ],
          },
          {
            id: "preview",
            heading: "A song has no preview",
            blocks: [
              {
                type: "p",
                text: "Previews are looked up by title and artist, and some tracks don't have one. The widget still shows the track and opens it on Spotify.",
              },
            ],
          },
          {
            id: "unsaved",
            heading: "My changes don't show on my profile",
            blocks: [
              {
                type: "p",
                text: "Edits in Customize and Settings go live when you press **Save changes** in the bar at the bottom. Then reload your profile.",
              },
            ],
          },
          {
            id: "contact",
            heading: "Still stuck?",
            blocks: [
              {
                type: "p",
                text: "Write to [support@fl3x.lol](mailto:support@fl3x.lol) with your FL3X handle and what you see. A screenshot helps.",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const HELP_PAGES: HelpPage[] = HELP_GROUPS.flatMap((g) => g.pages);

export function findHelp(slug: string) {
  const index = HELP_PAGES.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  const page = HELP_PAGES[index]!;
  return {
    page,
    group: HELP_GROUPS.find((g) => g.pages.includes(page))!.title,
    prev: HELP_PAGES[index - 1] ?? null,
    next: HELP_PAGES[index + 1] ?? null,
  };
}
