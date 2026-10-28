/**
 * Holder tiers. A user's tier is derived from how many $FL3X tokens
 * their verified wallets hold. Thresholds live in the API env so they
 * can be tuned without a deploy of the web app.
 */
export const TIERS = ["none", "starter", "premium"] as const;
export type Tier = (typeof TIERS)[number];

export type TierThresholds = { starter: number; premium: number };

export function tierForBalance(balance: number, t: TierThresholds): Tier {
  if (balance >= t.premium) return "premium";
  if (balance >= t.starter) return "starter";
  return "none";
}
