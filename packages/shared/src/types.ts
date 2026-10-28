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
