import { env } from "../../env";
import { fetchJson } from "../cache";

/**
 * EVM wallet value on the main networks. Free by default: native + major
 * tokens read from public RPCs (publicnode) and priced with DefiLlama.
 * With MORALIS_API_KEY every token the wallet holds is counted.
 */

export interface EvmPosition {
  id: string;
  network: string;
  symbol: string;
  name: string;
  iconUrl: string | null;
  amount: number;
  valueUsd: number;
}

export interface Network {
  id: string;
  name: string;
  chainId: number;
  rpc: string;
  /** Free RPC that serves past state (balances at an old block), for the history rebuilt from the chain. */
  archive?: string;
  /** Alchemy network slug (https://<slug>.g.alchemy.com), tried first when ALCHEMY_API_KEY is set. */
  alchemy?: string;
  llama: string;
  moralis: string;
  native: { symbol: string; name: string; llama: string };
  /** Optional 4th entry: price key when DefiLlama doesn't list the token on this chain. */
  tokens: [address: string, symbol: string, decimals: number, priceKey?: string][];
}

const ETH = { symbol: "ETH", name: "Ether", llama: "coingecko:ethereum" };

export const EVM_NETWORKS: Network[] = [
  {
    alchemy: "eth-mainnet", id: "ethereum", name: "Ethereum", chainId: 1, rpc: "https://ethereum-rpc.publicnode.com", archive: "https://eth.drpc.org", llama: "ethereum", moralis: "eth", native: ETH,
    tokens: [
      ["0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "USDC", 6],
      ["0xdac17f958d2ee523a2206206994597c13d831ec7", "USDT", 6],
      ["0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2", "WETH", 18],
      ["0x2260fac5e5542a773aa44fbcfedf7c193bc2c599", "WBTC", 8],
      ["0x6b175474e89094c44da98b954eedeac495271d0f", "DAI", 18],
      ["0x6982508145454ce325ddbe47a25d4ec3d2311933", "PEPE", 18],
      ["0x514910771af9ca656af840dff83e8264ecf986ca", "LINK", 18],
      ["0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce", "SHIB", 18],
      ["0x1f9840a85d5af5bf1d1762f925bdaddc4201f984", "UNI", 18],
    ],
  },
  {
    alchemy: "base-mainnet", id: "base", name: "Base", chainId: 8453, rpc: "https://base-rpc.publicnode.com", archive: "https://base.drpc.org", llama: "base", moralis: "base", native: ETH,
    tokens: [
      ["0x833589fcd6edb6e08f4c7c32d4f71b54bda02913", "USDC", 6],
      ["0x4200000000000000000000000000000000000006", "WETH", 18],
      ["0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf", "cbBTC", 8],
      ["0x4ed4e862860bed51a9570b96d89af5e1b0efefed", "DEGEN", 18],
      ["0x532f27101965dd16442e59d40670faf5ebb142e4", "BRETT", 18],
    ],
  },
  {
    alchemy: "arb-mainnet", id: "arbitrum", name: "Arbitrum", chainId: 42161, rpc: "https://arbitrum-one-rpc.publicnode.com", llama: "arbitrum", moralis: "arbitrum", native: ETH,
    tokens: [
      ["0xaf88d065e77c8cc2239327c5edb3a432268e5831", "USDC", 6],
      ["0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9", "USDT", 6],
      ["0x82af49447d8a07e3bd95bd0d56f35241523fbab1", "WETH", 18],
      ["0x912ce59144191c1204e64559fe8253a0e49e6548", "ARB", 18],
    ],
  },
  {
    alchemy: "opt-mainnet", id: "optimism", name: "Optimism", chainId: 10, rpc: "https://optimism-rpc.publicnode.com", archive: "https://optimism.drpc.org", llama: "optimism", moralis: "optimism", native: ETH,
    tokens: [
      ["0x0b2c639c533813f4aa9d7837caf62653d097ff85", "USDC", 6],
      ["0x4200000000000000000000000000000000000042", "OP", 18],
      ["0x4200000000000000000000000000000000000006", "WETH", 18],
    ],
  },
  {
    alchemy: "bnb-mainnet", id: "bsc", name: "BNB Chain", chainId: 56, rpc: "https://bsc-rpc.publicnode.com", llama: "bsc", moralis: "bsc",
    native: { symbol: "BNB", name: "BNB", llama: "coingecko:binancecoin" },
    tokens: [
      ["0x55d398326f99059ff775485246999027b3197955", "USDT", 18],
      ["0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d", "USDC", 18],
      ["0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", "WBNB", 18],
    ],
  },
  {
    alchemy: "polygon-mainnet", id: "polygon", name: "Polygon", chainId: 137, rpc: "https://polygon-bor-rpc.publicnode.com", archive: "https://polygon.drpc.org", llama: "polygon", moralis: "polygon",
    native: { symbol: "POL", name: "Polygon", llama: "coingecko:polygon-ecosystem-token" },
    tokens: [
      ["0x3c499c542cef5e3811e1192ce70d8cc03d5c3359", "USDC", 6],
      ["0xc2132d05d31c914a87c6611c10748aeb04b58e8f", "USDT", 6],
      ["0x7ceb23fd6bc0add59e62ac25578270cff1b9f619", "WETH", 18],
    ],
  },
  {
    // Arbitrum Orbit L2, gas in ETH. Its explorer API sits behind a bot wall and price
    // feeds don't list its tokens yet: ETH and WETH (priced as ETH). Moralis doesn't cover it.
    id: "robinhood", name: "Robinhood Chain", chainId: 4663, rpc: "https://rpc.mainnet.chain.robinhood.com", llama: "robinhood", moralis: "", native: ETH,
    tokens: [["0x0bd7d308f8e1639fab988df18a8011f41eacad73", "WETH", 18, "coingecko:ethereum"]],
  },
];

const chainIcon = (n: Network) => `https://icons.llamao.fi/icons/chains/rsz_${n.id === "bsc" ? "binance" : n.id}?w=48&h=48`;
const tokenIcon = (n: Network, address: string) => `https://token-icons.llamao.fi/icons/tokens/${n.chainId}/${address}?h=48&w=48`;

type RpcResult = { id: number; result?: string; error?: unknown };

/** RPCs that serve past state for a network, best first: Alchemy (when keyed), then the free dRPC (3 calls per batch at most). */
export function archiveEndpoints(n: Network): { url: string; batch: number }[] {
  return [
    ...(env.ALCHEMY_API_KEY && n.alchemy ? [{ url: `https://${n.alchemy}.g.alchemy.com/v2/${env.ALCHEMY_API_KEY}`, batch: 100 }] : []),
    ...(n.archive ? [{ url: n.archive, batch: 3 }] : []),
  ];
}

/** Balances at an old block: the first archive that answers. */
async function balancesAt(n: Network, owner: string, block: number): Promise<{ native: bigint; tokens: bigint[] }> {
  let last: unknown = new Error(`${n.id}: no archive RPC`);
  for (const endpoint of archiveEndpoints(n)) {
    try {
      return await readBalances(n, owner, `0x${block.toString(16)}`, endpoint.url, endpoint.batch);
    } catch (err) {
      last = err;
    }
  }
  throw last;
}

/** One JSON-RPC batch per network: native balance + balanceOf for each known token (now, or at an old block on an archive RPC). */
export async function balancesOn(n: Network, owner: string, block: number | "latest" = "latest"): Promise<{ native: bigint; tokens: bigint[] }> {
  return block === "latest" ? readBalances(n, owner, "latest", n.rpc, Infinity) : balancesAt(n, owner, block);
}

async function readBalances(n: Network, owner: string, tag: string, url: string, size: number): Promise<{ native: bigint; tokens: bigint[] }> {
  const data = (token: string) => ({ to: token, data: `0x70a08231000000000000000000000000${owner.slice(2).toLowerCase()}` });
  const batch = [
    { jsonrpc: "2.0", id: 0, method: "eth_getBalance", params: [owner, tag] },
    ...n.tokens.map(([token], i) => ({ jsonrpc: "2.0", id: i + 1, method: "eth_call", params: [data(token), tag] })),
  ];
  const parts = await Promise.all(
    Array.from({ length: Math.ceil(batch.length / Math.min(size, batch.length)) }, (_, k) =>
      fetchJson<RpcResult[]>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(batch.slice(k * size, (k + 1) * size)) }),
    ),
  );
  const res = parts.flat();
  if (tag !== "latest" && res.some((r) => r.error)) throw new Error(`${n.id}: no state at block ${tag}`);
  const byId = new Map(res.map((r) => [r.id, r.result && r.result !== "0x" ? BigInt(r.result) : 0n]));
  return { native: byId.get(0) ?? 0n, tokens: n.tokens.map((_, i) => byId.get(i + 1) ?? 0n) };
}

export const units = (raw: bigint, decimals: number) => Number(raw) / 10 ** decimals;

async function llamaPrices(keys: string[]): Promise<Record<string, number>> {
  if (keys.length === 0) return {};
  const res = await fetchJson<{ coins: Record<string, { price: number }> }>(`https://coins.llama.fi/prices/current/${keys.join(",")}`);
  return Object.fromEntries(Object.entries(res.coins).map(([k, v]) => [k, v.price]));
}

type Read = { positions: EvmPosition[]; complete: boolean };

async function viaRpc(owner: string, networks: Network[]): Promise<Read> {
  const results = await Promise.allSettled(networks.map((n) => balancesOn(n, owner)));
  let complete = results.every((r) => r.status === "fulfilled");
  const held: { n: Network; key: string; symbol: string; name: string; icon: string; amount: number; id: string }[] = [];
  results.forEach((r, i) => {
    if (r.status !== "fulfilled") return; // one slow network shouldn't hide the others
    const n = networks[i]!;
    if (r.value.native > 0n) held.push({ n, key: n.native.llama, symbol: n.native.symbol, name: n.native.name, icon: chainIcon(n), amount: units(r.value.native, 18), id: `${n.id}:native` });
    r.value.tokens.forEach((raw, j) => {
      if (raw === 0n) return;
      const [address, symbol, decimals, priceKey] = n.tokens[j]!;
      held.push({ n, key: priceKey ?? `${n.llama}:${address}`, symbol, name: symbol, icon: tokenIcon(n, address), amount: units(raw, decimals), id: `${n.id}:${address}` });
    });
  });
  const prices = await llamaPrices([...new Set(held.map((h) => h.key))]).catch(() => {
    complete = false;
    return {} as Record<string, number>;
  });
  const positions = held
    .map((h) => ({ id: h.id, network: h.n.id, symbol: h.symbol, name: h.name, iconUrl: h.icon, amount: h.amount, valueUsd: h.amount * (prices[h.key] ?? 0) }))
    .filter((p) => p.valueUsd >= 0.01);
  return { positions, complete };
}

type MoralisToken = {
  token_address: string; symbol: string; name: string; logo: string | null; balance_formatted: string;
  usd_value: number | null; native_token: boolean; possible_spam: boolean;
};

async function viaMoralis(owner: string, networks: Network[]): Promise<Read> {
  const results = await Promise.allSettled(
    networks.map((n) =>
      fetchJson<{ result: MoralisToken[] }>(`https://deep-index.moralis.io/api/v2.2/wallets/${owner}/tokens?chain=${n.moralis}&exclude_spam=true`, {
        headers: { "x-api-key": env.MORALIS_API_KEY },
      }).then((r) => ({ n, tokens: r.result })),
    ),
  );
  const positions = results.flatMap((r) =>
    r.status !== "fulfilled"
      ? []
      : r.value.tokens
          .filter((t) => !t.possible_spam && (t.usd_value ?? 0) >= 0.01)
          .map((t) => ({
            id: `${r.value.n.id}:${t.native_token ? "native" : t.token_address}`,
            network: r.value.n.id,
            symbol: t.symbol,
            name: t.name,
            iconUrl: t.logo ?? (t.native_token ? chainIcon(r.value.n) : tokenIcon(r.value.n, t.token_address)),
            amount: Number(t.balance_formatted),
            valueUsd: t.usd_value ?? 0,
          })),
  );
  return { positions, complete: results.every((r) => r.status === "fulfilled") };
}

/** Positions across every EVM network; `complete` is false when a network or the price feed failed. */
export async function evmPositions(owner: string): Promise<Read> {
  if (!env.MORALIS_API_KEY) return viaRpc(owner, EVM_NETWORKS);
  // Moralis where it covers the network, our RPC reads elsewhere.
  const [a, b] = await Promise.all([
    viaMoralis(owner, EVM_NETWORKS.filter((n) => n.moralis)),
    viaRpc(owner, EVM_NETWORKS.filter((n) => !n.moralis)),
  ]);
  return { positions: [...a.positions, ...b.positions], complete: a.complete && b.complete };
}

export const evmNetworkName = (id: string) => EVM_NETWORKS.find((n) => n.id === id)?.name ?? id;
