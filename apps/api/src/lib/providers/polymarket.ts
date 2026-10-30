import type { PolymarketData } from "@fl3x/shared";
import { cached, fetchJson } from "../cache";

const DATA = "https://data-api.polymarket.com";
const GAMMA = "https://gamma-api.polymarket.com";
const MAX_POSITIONS = 5;
/** Positions worth less than this (lost bets not redeemed yet, dust) are left out. */
const MIN_VALUE = 0.01;

type Position = {
  size: number;
  avgPrice: number;
  curPrice: number;
  currentValue: number;
  cashPnl: number;
  percentPnl: number;
  redeemable: boolean;
  title: string;
  outcome: string;
  icon?: string;
  slug?: string;
  eventSlug?: string;
};

type Profile = { name?: string | null; pseudonym?: string | null; displayUsernamePublic?: boolean; proxyWallet?: string };

const ADDRESS = /^0x[0-9a-fA-F]{40}$/;

/**
 * The widget's `user` setting → a Polymarket wallet: an address, a profile URL
 * (polymarket.com/profile/0x… or polymarket.com/@name) or "@name". Returns
 * { address } or { handle } (resolved later), or null when it reads as neither.
 */
export function parsePolymarketUser(input: string): { address: string } | { handle: string } | null {
  const v = input.trim();
  if (ADDRESS.test(v)) return { address: v.toLowerCase() };
  const url = v.match(/^(?:https?:\/\/)?(?:www\.)?polymarket\.com\/(?:profile\/)?(@?[^/?#]+)/i);
  const part = url ? decodeURIComponent(url[1]!) : v;
  if (ADDRESS.test(part)) return { address: part.toLowerCase() };
  const handle = part.replace(/^@/, "");
  return /^[A-Za-z0-9._-]{1,50}$/.test(handle) ? { handle } : null;
}

/**
 * Username → proxy wallet through Gamma's public search. The search is fuzzy,
 * so only an exact (case-insensitive) username match counts. Cached 1 h.
 */
function resolveHandle(handle: string) {
  return cached<string | null>(`polymarket-handle:${handle.toLowerCase()}`, 3600, async () => {
    const res = await fetchJson<{ profiles?: Profile[] | null }>(
      `${GAMMA}/public-search?q=${encodeURIComponent(handle)}&search_profiles=true&limit_per_type=20`,
    );
    const hit = res.profiles?.find((p) => p.name?.toLowerCase() === handle.toLowerCase() && p.proxyWallet);
    return hit?.proxyWallet?.toLowerCase() ?? null;
  });
}

async function profile(address: string): Promise<Profile | null> {
  const res = await fetch(`${GAMMA}/public-profile?address=${address}`, { signal: AbortSignal.timeout(8000) });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`gamma-api.polymarket.com responded ${res.status}`);
  return res.json() as Promise<Profile>;
}

/** Open positions of a public Polymarket wallet, biggest first. Null when the wallet is unknown. Cached 2 min. */
function wallet(address: string) {
  return cached<PolymarketData | null>(`polymarket:${address}`, 120, async () => {
    const [positions, prof] = await Promise.all([
      fetchJson<Position[]>(`${DATA}/positions?user=${address}&sortBy=CURRENT&sortDirection=DESC&limit=500`),
      profile(address).catch(() => null),
    ]);
    if (!prof && positions.length === 0) return null;
    const held = positions.filter((p) => p.currentValue >= MIN_VALUE);
    const open = held.filter((p) => !p.redeemable);
    const round = (n: number) => Math.round(n * 100) / 100;
    return {
      name: (prof?.displayUsernamePublic !== false && prof?.name) || prof?.pseudonym || null,
      // Totals count won-but-unredeemed shares too: that's money still on the account.
      totalValue: round(held.reduce((s, p) => s + p.currentValue, 0)),
      totalPnl: round(held.reduce((s, p) => s + p.cashPnl, 0)),
      positions: open.slice(0, MAX_POSITIONS).map((p) => ({
        title: p.title,
        outcome: p.outcome,
        size: p.size,
        avgPrice: p.avgPrice,
        curPrice: p.curPrice,
        valueUsd: round(p.currentValue),
        pnl: round(p.cashPnl),
        pnlPct: round(p.percentPnl),
        icon: p.icon || null,
        url: `https://polymarket.com/event/${p.eventSlug || p.slug}`,
      })),
      url: `https://polymarket.com/profile/${address}`,
    };
  });
}

/** Polymarket widget data for an address, profile URL or @username. Null when not found. */
export async function getPolymarket(user: string): Promise<PolymarketData | null> {
  const parsed = parsePolymarketUser(user);
  if (!parsed) return null;
  const address = "address" in parsed ? parsed.address : await resolveHandle(parsed.handle);
  return address ? wallet(address) : null;
}
