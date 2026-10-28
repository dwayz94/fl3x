import { cached, fetchJson } from "../cache";

// Docs: https://docs.dexscreener.com/api/reference
interface Pair {
  chainId: string;
  url: string;
  baseToken: { address: string; name: string; symbol: string };
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  liquidity?: { usd?: number };
  priceChange?: { h24?: number };
  info?: { imageUrl?: string };
}

export interface TokenData {
  chain: string;
  address: string;
  name: string;
  symbol: string;
  priceUsd: number | null;
  marketCap: number | null;
  change24h: number | null;
  imageUrl: string | null;
  url: string;
}

export function getToken(chain: string, address: string) {
  return cached<TokenData | null>(`token:${chain}:${address}`, 60, async () => {
    const pairs = await fetchJson<Pair[]>(`https://api.dexscreener.com/tokens/v1/${chain}/${address}`);
    const best = pairs
      .filter((p) => p.baseToken.address.toLowerCase() === address.toLowerCase())
      .sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0))[0];
    if (!best) return null;
    return {
      chain,
      address,
      name: best.baseToken.name,
      symbol: best.baseToken.symbol,
      priceUsd: best.priceUsd ? Number(best.priceUsd) : null,
      marketCap: best.marketCap ?? best.fdv ?? null,
      change24h: best.priceChange?.h24 ?? null,
      imageUrl: best.info?.imageUrl ?? null,
      url: best.url,
    };
  });
}
