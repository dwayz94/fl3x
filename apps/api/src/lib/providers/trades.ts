import { createHash } from "node:crypto";
import type { TradesData } from "@fl3x/shared";
import { env } from "../../env";
import { cached, fetchJson } from "../cache";
import { HttpError } from "../errors";
import { JUP, jupHeaders } from "./wallet";

const SOL = "So11111111111111111111111111111111111111112"; // wrapped SOL: counted as SOL
const STABLES: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: "USDC",
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY35mCbcrRYFgmEp: "USDT",
};
const isQuote = (mint: string) => mint === SOL || mint in STABLES;
const MAX_ITEMS = 5;
const LAMPORTS = 1e9;

/** Helius key: HELIUS_API_KEY, else the api-key of SOLANA_RPC_URL when that's a Helius RPC (production). */
export function heliusKey(): string | null {
  if (env.HELIUS_API_KEY) return env.HELIUS_API_KEY;
  try {
    const url = new URL(env.SOLANA_RPC_URL);
    if (url.hostname.endsWith("helius-rpc.com") || url.hostname.endsWith("helius.xyz")) return url.searchParams.get("api-key");
  } catch {}
  return null;
}

type Raw = { tokenAmount: string; decimals: number };
type TokenSide = { userAccount?: string; mint: string; rawTokenAmount: Raw };

/** The parts of a Helius Enhanced Transaction we read (GET /v0/addresses/{address}/transactions). */
export type HeliusTx = {
  signature: string;
  timestamp: number;
  fee?: number;
  feePayer?: string;
  transactionError?: unknown;
  accountData?: { account: string; nativeBalanceChange: number; tokenBalanceChanges?: (TokenSide & { tokenAccount?: string })[] }[];
  events?: {
    swap?: {
      nativeInput?: { account: string; amount: string | number } | null;
      nativeOutput?: { account: string; amount: string | number } | null;
      tokenInputs?: TokenSide[];
      tokenOutputs?: TokenSide[];
    };
  };
};

/** A swap as read from the chain, before token metadata and prices. Cached as is. */
type RawTrade = { signature: string; at: string; side: "buy" | "sell"; mint: string; amount: number; quoteMint: string; quoteAmount: number };

const ui = (r: Raw) => Number(r.tokenAmount) / 10 ** r.decimals;

/** Net change of each mint for the wallet (SOL under the wrapped SOL mint). */
function deltas(tx: HeliusTx, wallet: string): Map<string, number> {
  const d = new Map<string, number>();
  const add = (mint: string, n: number) => n && d.set(mint, (d.get(mint) ?? 0) + n);

  // 1. Helius' own swap event: exact amounts, no fees or rent mixed in.
  const swap = tx.events?.swap;
  if (swap) {
    if (swap.nativeInput) add(SOL, -Number(swap.nativeInput.amount) / LAMPORTS);
    if (swap.nativeOutput) add(SOL, Number(swap.nativeOutput.amount) / LAMPORTS);
    for (const t of swap.tokenInputs ?? []) if (!t.userAccount || t.userAccount === wallet) add(t.mint, -ui(t.rawTokenAmount));
    for (const t of swap.tokenOutputs ?? []) if (!t.userAccount || t.userAccount === wallet) add(t.mint, ui(t.rawTokenAmount));
    if (d.size >= 2) return d;
    d.clear();
  }

  // 2. Balance changes (swaps Helius doesn't describe, e.g. some launchpads). SOL includes
  // the fee (added back) and token-account rent (~0.002 SOL, not removable here).
  for (const a of tx.accountData ?? []) {
    if (a.account === wallet) add(SOL, (a.nativeBalanceChange + (tx.feePayer === wallet ? tx.fee ?? 0 : 0)) / LAMPORTS);
    for (const t of a.tokenBalanceChanges ?? []) if (t.userAccount === wallet) add(t.mint, ui(t.rawTokenAmount));
  }
  return d;
}

/**
 * One swap → a buy (SOL / USDC / USDT out, a token in) or a sell (the
 * reverse). Null when it can't be read that way (quote-to-quote swaps,
 * token-to-token swaps, failed transactions).
 */
export function parseSwap(tx: HeliusTx, wallet: string): RawTrade | null {
  if (tx.transactionError) return null;
  const d = deltas(tx, wallet);
  const tokens = [...d].filter(([mint, n]) => !isQuote(mint) && n !== 0).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const token = tokens[0];
  if (!token) return null;
  const bought = token[1] > 0;
  // The quote moves the other way. A stablecoin wins over SOL: SOL moving the same way is fees / rent.
  const quotes = [...d].filter(([mint, n]) => isQuote(mint) && (bought ? n < 0 : n > 0));
  const quote = quotes.find(([mint]) => mint in STABLES) ?? quotes.find(([mint]) => mint === SOL);
  if (!quote) return null;
  return {
    signature: tx.signature,
    at: new Date(tx.timestamp * 1000).toISOString(),
    side: bought ? "buy" : "sell",
    mint: token[0],
    amount: Math.abs(token[1]),
    quoteMint: quote[0],
    quoteAmount: Math.abs(quote[1]),
  };
}

/** Latest swaps of one wallet. Cached 2 min. */
function walletTrades(wallet: string, key: string) {
  return cached<RawTrade[]>(`trades:${wallet}`, 120, async () => {
    const res = await fetch(`https://api.helius.xyz/v0/addresses/${wallet}/transactions?api-key=${encodeURIComponent(key)}&type=SWAP&limit=20`, {
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      // With a type filter, Helius answers an error when no such transaction is in its search window.
      const body = await res.text().catch(() => "");
      if (/failed to find events/i.test(body)) return [];
      throw new Error(`Helius responded ${res.status}`);
    }
    const txs = (await res.json()) as HeliusTx[];
    return txs.flatMap((tx) => parseSwap(tx, wallet) ?? []).slice(0, MAX_ITEMS);
  });
}

/** Three significant digits. */
const round3 = (n: number) => (n === 0 ? 0 : Number(n.toPrecision(3)));

type JupToken = { id: string; symbol: string; name: string; icon?: string };

/** Same cache key and shape as the portfolio's token metadata. */
async function metadata(mints: string[]): Promise<Map<string, JupToken>> {
  if (mints.length === 0) return new Map();
  const key = [...mints].sort().join(",");
  const meta = await cached<JupToken[]>(`jup-tokens:${key}`, 600, () =>
    fetchJson<JupToken[]>(`${JUP}/tokens/v2/search?query=${key}`, { headers: jupHeaders() }),
  ).catch(() => [] as JupToken[]);
  return new Map(meta.map((m) => [m.id, m]));
}

function solPrice() {
  return cached<number | null>("jup-price:sol", 60, async () => {
    const res = await fetchJson<Record<string, { usdPrice?: number }>>(`${JUP}/price/v3?ids=${SOL}`, { headers: jupHeaders() });
    return res[SOL]?.usdPrice ?? null;
  }).catch(() => null);
}

/** Latest swaps across a member's Solana wallets, newest first. */
export async function getTrades(wallets: string[]): Promise<TradesData> {
  const solana = wallets.filter((w) => !w.startsWith("0x"));
  if (solana.length === 0) return { items: [], wallets: 0 };
  const key = heliusKey();
  if (!key) throw new HttpError(503, "unavailable", "Recent trades aren't available right now");

  const settled = await Promise.allSettled(solana.map((w) => walletTrades(w, key)));
  const failed = settled.find((r) => r.status === "rejected");
  if (failed && settled.every((r) => r.status === "rejected")) throw failed.reason;
  const lists = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const seen = new Set<string>(); // a swap between two of the member's wallets shows once
  const trades = lists
    .flat()
    .sort((a, b) => b.at.localeCompare(a.at))
    .filter((t) => !seen.has(t.signature) && seen.add(t.signature))
    .slice(0, MAX_ITEMS);
  const [meta, sol] = await Promise.all([metadata([...new Set(trades.map((t) => t.mint))]), solPrice()]);

  return {
    items: trades.map((t) => {
      const m = meta.get(t.mint);
      const quotePrice = t.quoteMint === SOL ? sol : 1;
      // Exact amounts and seconds would find the transaction (so the wallet) on an explorer: rounded, as the widget shows them anyway.
      return {
        id: createHash("sha256").update(t.signature).digest("hex").slice(0, 16),
        at: new Date(Math.floor(new Date(t.at).getTime() / 3_600_000) * 3_600_000).toISOString(),
        side: t.side,
        token: { address: t.mint, symbol: m?.symbol ?? `${t.mint.slice(0, 4)}…`, name: m?.name ?? null, iconUrl: m?.icon ?? null },
        amount: round3(t.amount),
        quote: { symbol: STABLES[t.quoteMint] ?? "SOL", amount: round3(t.quoteAmount) },
        valueUsd: quotePrice == null ? null : round3(t.quoteAmount * quotePrice),
      };
    }),
    wallets: solana.length,
  };
}
