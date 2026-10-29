import type { LaunchPhase } from "./launch";
import type { Tier } from "./tiers";

export interface PublicConfig {
  phase: LaunchPhase;
  token: { symbol: string; mint: string | null };
  thresholds: { starter: number; premium: number };
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
