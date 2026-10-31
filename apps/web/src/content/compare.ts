// Comparison pages (/vs/<slug>). Only state what is true of the other product in general
// terms (no prices, they change); FL3X facts come from what the product really does.
import { TIER_LIMITS } from "@fl3x/shared";
import type { HelpSection } from "@/components/help/content";

export interface Comparison {
  slug: string;
  name: string;
  description: string;
  /** One line on what the other product is. */
  summary: string;
  /** [feature, FL3X, them] */
  rows: [string, string, string][];
  sections: HelpSection[];
}

export const COMPARISONS: Comparison[] = [
  {
    slug: "linktree",
    name: "Linktree",
    description: "FL3X vs Linktree: a link-in-bio made of live crypto widgets and verified wallets, compared with the classic list of links.",
    summary: "Linktree is the best-known link-in-bio: a page with a list of buttons, used by creators and brands everywhere.",
    rows: [
      ["Free plan", "Yes", "Yes"],
      ["Links to your socials", `Yes (${TIER_LIMITS.none.links} free, up to ${TIER_LIMITS.premium.links})`, "Yes"],
      ["Live wallet portfolio and P&L", "Yes", "No"],
      ["Wallets verified by signature", "Yes, EVM and Solana", "No"],
      ["Live token prices and charts", "Yes", "No"],
      ["Community member counts (Discord, Telegram)", "Yes", "No"],
      ["Profile analytics", "Yes", "Yes"],
      ["Extra features unlocked by", "Holding $FL3X, no subscription", "A paid subscription"],
    ],
    sections: [
      {
        id: "when-linktree",
        heading: "When Linktree is the better pick",
        blocks: [
          { type: "p", text: "If you only need a list of links, sell products from your page or run a brand outside crypto, Linktree does that well and has a huge ecosystem of integrations." },
        ],
      },
      {
        id: "when-fl3x",
        heading: "When FL3X is the better pick",
        blocks: [
          { type: "p", text: "If your audience cares about what you hold and trade, FL3X shows it live: portfolio, P&L, holdings, NFTs, tokens, Hyperliquid and Polymarket, from wallets you proved are yours. Addresses stay off the page." },
          { type: "p", text: "Your links are still there, including your trading terminal referral links. See [what each tier gets](/token)." },
        ],
      },
    ],
  },
  {
    slug: "carrd",
    name: "Carrd",
    description: "FL3X vs Carrd: a ready-made crypto profile with live on-chain widgets, compared with a one-page website builder.",
    summary: "Carrd is a builder for simple one-page websites: you lay out the page yourself, block by block.",
    rows: [
      ["Free plan", "Yes", "Yes"],
      ["Ready in minutes, no layout to design", "Yes", "You build the page"],
      ["Live wallet portfolio and P&L", "Yes", "No (custom code at most)"],
      ["Wallets verified by signature", "Yes, EVM and Solana", "No"],
      ["Live token prices, NFTs, Hyperliquid, Polymarket", "Yes", "No"],
      ["Your own domain", "No, fl3x.lol/@you", "Yes, on paid plans"],
      ["Extra features unlocked by", "Holding $FL3X, no subscription", "A paid plan"],
    ],
    sections: [
      {
        id: "when-carrd",
        heading: "When Carrd is the better pick",
        blocks: [
          { type: "p", text: "If you want a full landing page for a project, with your own domain, forms and a layout of your own, Carrd gives you that freedom." },
        ],
      },
      {
        id: "when-fl3x",
        heading: "When FL3X is the better pick",
        blocks: [
          { type: "p", text: "If the page is about you, a trader, a creator or a builder, FL3X gives you a profile made of live widgets in a few clicks: drag them in, pick your wallets, done. The data stays live without any code." },
        ],
      },
    ],
  },
];

export const findComparison = (slug: string) => COMPARISONS.find((c) => c.slug === slug);
