import { site } from "@/config/site";

const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

export const fmtCompact = (n: number) => compact.format(n);
export const fmtUsd = (n: number) => usd.format(n);
export const fmtUsdCompact = (n: number) => usdCompact.format(n);
export const fmtNumber = (n: number) => n.toLocaleString("en-US");
export const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(Math.abs(n) < 10 ? 2 : 1)}%`;

/** Splits $134,548.73 into ["$134,548", ".73"] for the two-tone number style. */
export function splitUsd(n: number): [string, string] {
  const s = usd.format(n);
  const i = s.lastIndexOf(".");
  return i === -1 ? [s, ""] : [s.slice(0, i), s.slice(i)];
}

export const shortAddress = (a: string) => `${a.slice(0, 4)}…${a.slice(-4)}`;

export function flagUrl(country?: string | number) {
  const c = String(country ?? "").toLowerCase();
  // flagcdn.com: free flag API, SVG stays sharp at any size.
  return /^[a-z]{2}$/.test(c) ? `https://flagcdn.com/${c}.svg` : null;
}

/** The referral link carries the member's handle: fl3x.lol/invite/alice */
export const referralLink = (username: string) => `${site.url}/invite/${username}`;
