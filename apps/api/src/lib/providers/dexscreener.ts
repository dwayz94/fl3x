import { cached, fetchJson } from "../cache";
import { JUP, jupHeaders } from "./wallet";

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

/**
 * DexScreener first. It rate-limits shared server IPs (429 from Render), so
 * Solana mints fall back to Jupiter and every chain to GeckoTerminal.
 * null = no source knows the token.
 */
export function getToken(chain: string, address: string) {
  return cached<TokenData | null>(`token:${chain}:${address}`, 120, async () => {
    const sources = [fromDexScreener, ...(chain === "solana" ? [fromJupiter] : []), fromGeckoTerminal];
    let lastError: unknown = null;
    let answered = false;
    for (const source of sources) {
      try {
        const token = await source(chain, address);
        if (token) return token;
        answered = true;
      } catch (err) {
        lastError = err;
      }
    }
    // A source that answered "unknown token" beats one that was just down.
    if (lastError && !answered) throw lastError;
    return null;
  });
}

async function fromDexScreener(chain: string, address: string): Promise<TokenData | null> {
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
}

type JupToken = { id: string; name: string; symbol: string; icon?: string; usdPrice?: number; mcap?: number; fdv?: number; stats24h?: { priceChange?: number } };

async function fromJupiter(chain: string, address: string): Promise<TokenData | null> {
  const list = await fetchJson<JupToken[]>(`${JUP}/tokens/v2/search?query=${address}`, { headers: jupHeaders() });
  const t = list.find((x) => x.id === address);
  if (!t) return null;
  return {
    chain,
    address,
    name: t.name,
    symbol: t.symbol,
    priceUsd: t.usdPrice ?? null,
    marketCap: t.mcap ?? t.fdv ?? null,
    change24h: t.stats24h?.priceChange ?? null,
    imageUrl: t.icon ?? null,
    url: `https://dexscreener.com/solana/${address}`,
  };
}

// Our chain ids → GeckoTerminal network ids.
const GT_NETWORK: Record<string, string> = { solana: "solana", ethereum: "eth", base: "base", bsc: "bsc", arbitrum: "arbitrum", robinhood: "robinhood" };
const num = (v: string | null | undefined) => (v == null || v === "" ? null : Number(v));

interface GtToken {
  data: { attributes: { name: string; symbol: string; image_url?: string | null; price_usd?: string | null; market_cap_usd?: string | null; fdv_usd?: string | null } };
  included?: { attributes: { price_change_percentage?: { h24?: string } } }[];
}

async function fromGeckoTerminal(chain: string, address: string): Promise<TokenData | null> {
  const network = GT_NETWORK[chain];
  if (!network) return null;
  const res = await fetch(`https://api.geckoterminal.com/api/v2/networks/${network}/tokens/${address}?include=top_pools`, {
    headers: { accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`api.geckoterminal.com responded ${res.status}`);
  const { data, included } = (await res.json()) as GtToken;
  const a = data.attributes;
  return {
    chain,
    address,
    name: a.name,
    symbol: a.symbol,
    priceUsd: num(a.price_usd),
    marketCap: num(a.market_cap_usd) ?? num(a.fdv_usd),
    change24h: num(included?.[0]?.attributes.price_change_percentage?.h24),
    // GeckoTerminal answers "missing.png" when it has no logo.
    imageUrl: a.image_url && !a.image_url.includes("missing") ? a.image_url : null,
    url: `https://dexscreener.com/${chain}/${address}`,
  };
}
