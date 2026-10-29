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
