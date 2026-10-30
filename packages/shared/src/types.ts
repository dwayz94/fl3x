import type { LaunchPhase } from "./launch";
import type { Tier } from "./tiers";

export interface PublicConfig {
  phase: LaunchPhase;
  token: { symbol: string; mint: string | null };
  thresholds: { starter: number; premium: number };
  /** Custom banner from the API env (BANNER_*): null = automatic text from the phase, "off" = hidden. */
  banner: Banner | "off" | null;
}

/** The strip under the landing navbar: "message ∙ detail  Link". */
export interface Banner {
  text: string;
  detail: string | null;
  link: { label: string; url: string } | null;
}

export interface Me {
  id: string;
  username: string | null;
  xHandle: string | null;
  wallets: string[];
  tier: Tier;
  tokenBalance: number;
  referralCode: string;
  invitesLeft: number;
  referrals: number;
  role: "user" | "admin";
  linkedWallets: LinkedWallet[];
}

export interface PublicProfile {
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  tier: Tier;
  xHandle: string | null;
}

export interface ApiError {
  error: string;
  message: string;
}

export interface WaitlistStatus {
  joined: boolean;
  xHandle: string | null;
  position: number | null;
  total: number;
}

export type WalletChain = "solana" | "evm";

export interface LinkedWallet {
  id: string;
  chain: WalletChain;
  address: string;
  label: string | null;
  /** "login": the Solana wallet used to sign in; "signature": linked in Settings. */
  source: "login" | "signature";
}

/** Combined value of one or more wallets, any chain. Addresses are never included. */
export interface PortfolioData {
  valueUsd: number;
  period: string;
  start: { valueUsd: number; at: string } | null;
  changeUsd: number | null;
  changePct: number | null;
  history: { at: string; valueUsd: number }[];
  holdings: {
    id: string;
    chain: string;
    symbol: string;
    name: string;
    iconUrl: string | null;
    amount: number;
    valueUsd: number;
    change24h: number | null;
  }[];
  /** Value per network, biggest first (Solana, Ethereum, Base…). */
  networks: { id: string; name: string; valueUsd: number }[];
  wallets: number;
}

export interface ReferralSummary {
  username: string;
  /** Legacy invite code, still accepted. The link uses the handle. */
  code: string | null;
  invitesLeft: number;
  referrals: number;
  /** Your place among members, by referrals. */
  rank: number;
  members: number;
  /** Referrals still needed to pass the next member above you (0 when you're first). */
  toNextRank: number;
  nextRank: number | null;
  invited: { username: string; displayName: string | null; avatarUrl: string | null; joinedAt: string | null }[];
  leaderboard: { rank: number; username: string; displayName: string | null; avatarUrl: string | null; premium: boolean; referrals: number; you: boolean }[];
}

/** NFTs from a member's verified Solana wallets (NFT gallery widget). */
export interface NftData {
  items: { id: string; name: string; image: string; collection: string | null }[];
  /** NFTs found across the wallets (the widget shows a few). */
  total: number;
  /** Solana wallets read. */
  wallets: number;
}

/** Last swaps of a member's verified Solana wallets (Recent Trades widget). Addresses are never included. */
export interface TradesData {
  items: {
    /** Transaction signature (links to Solscan). */
    signature: string;
    at: string;
    /** "buy": SOL / a stablecoin out, a token in. "sell": the other way. */
    side: "buy" | "sell";
    token: { address: string; symbol: string; name: string | null; iconUrl: string | null };
    /** Tokens bought or sold. */
    amount: number;
    /** What was paid / received for them. */
    quote: { symbol: string; amount: number };
    /** USD value of the swap at today's price of the quote (null when unknown). */
    valueUsd: number | null;
  }[];
  /** Solana wallets read. */
  wallets: number;
}

/** Hyperliquid perps account of a member's verified EVM wallets (Hyperliquid widget). */
export interface HyperliquidData {
  accountValue: number;
  unrealizedPnl: number;
  /** Realized + unrealized P&L over each window, from Hyperliquid's own portfolio history. */
  pnl: { day: number | null; week: number | null; month: number | null; allTime: number | null };
  positions: { coin: string; side: "long" | "short"; size: number; entryPx: number; valueUsd: number; unrealizedPnl: number; leverage: number | null }[];
  /** EVM wallets read. */
  wallets: number;
}

/** Open Polymarket positions of a public Polymarket profile (Polymarket widget). */
export interface PolymarketData {
  /** The profile's display name on Polymarket, when it has one. */
  name: string | null;
  totalValue: number;
  totalPnl: number;
  positions: { title: string; outcome: string; size: number; avgPrice: number; curPrice: number; valueUsd: number; pnl: number; pnlPct: number; icon: string | null; url: string }[];
  url: string;
}
