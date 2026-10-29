import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { PERIODS, type PeriodId, type PortfolioData } from "@fl3x/shared";
import { db, schema } from "../../db";
import { env } from "../../env";
import { cached, fetchJson } from "../cache";
import { isEvmAddress } from "../wallets";
import { evmNetworkName, evmPositions } from "./evm";

const SOL_MINT = "So11111111111111111111111111111111111111112";
const TOKEN_PROGRAMS = ["TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA", "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"];

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const json = await fetchJson<{ result?: T; error?: { message: string } }>(env.SOLANA_RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  if (json.error) throw new Error(`Solana RPC: ${json.error.message}`);
  return json.result as T;
}

type TokenAccounts = { value: { account: { data: { parsed: { info: { mint: string; tokenAmount: { uiAmount: number | null } } } } } }[] };

// Jupiter Price API v3 / Tokens API v2. Free host without a key; api.jup.ag with JUPITER_API_KEY.
const JUP = env.JUPITER_API_KEY ? "https://api.jup.ag" : "https://lite-api.jup.ag";
const jupHeaders = (): Record<string, string> => (env.JUPITER_API_KEY ? { "x-api-key": env.JUPITER_API_KEY } : {});
const MAX_PRICED_MINTS = 200; // spam-token wallets can hold thousands

async function prices(mints: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const list = mints.slice(0, MAX_PRICED_MINTS);
  for (let i = 0; i < list.length; i += 50) {
    try {
      const res = await fetchJson<Record<string, { usdPrice?: number }>>(`${JUP}/price/v3?ids=${list.slice(i, i + 50).join(",")}`, { headers: jupHeaders() });
      for (const [mint, p] of Object.entries(res)) if (p?.usdPrice) out[mint] = p.usdPrice;
    } catch (err) {
      // SOL is in the first batch: without it the value is meaningless.
      if (i === 0) throw err;
    }
  }
  return out;
}

/** A position in one wallet, before token metadata is attached. */
interface Position {
  id: string;
  network: string;
  amount: number;
  valueUsd: number;
  symbol?: string;
  name?: string;
  iconUrl?: string | null;
}

interface Valuation {
  total: number;
  /** Biggest positions by USD value. */
  top: Position[];
  networks: Record<string, number>;
}

const TOP_POSITIONS = 8;

async function solanaValuation(wallet: string): Promise<Valuation> {
  const [lamports, ...accounts] = await Promise.all([
    rpc<{ value: number }>("getBalance", [wallet]),
    ...TOKEN_PROGRAMS.map((programId) => rpc<TokenAccounts>("getTokenAccountsByOwner", [wallet, { programId }, { encoding: "jsonParsed" }])),
  ]);
  const balances = new Map<string, number>([[SOL_MINT, lamports.value / 1e9]]);
  for (const list of accounts) {
    for (const a of list.value) {
      const { mint, tokenAmount } = a.account.data.parsed.info;
      if (tokenAmount.uiAmount) balances.set(mint, (balances.get(mint) ?? 0) + tokenAmount.uiAmount);
    }
  }
  // Largest balances first so the cap keeps what most likely matters.
  const mints = [...balances.entries()].sort((a, b) => (a[0] === SOL_MINT ? -1 : b[0] === SOL_MINT ? 1 : b[1] - a[1])).map(([m]) => m);
  const p = await prices(mints);
  const positions: Position[] = [];
  let total = 0;
  for (const [mint, amount] of balances) {
    const valueUsd = amount * (p[mint] ?? 0);
    total += valueUsd;
    if (valueUsd >= 1) positions.push({ id: mint, network: "solana", amount, valueUsd });
  }
  positions.sort((a, b) => b.valueUsd - a.valueUsd);
  return { total, top: positions.slice(0, TOP_POSITIONS), networks: { solana: total } };
}

async function evmValuation(wallet: string): Promise<Valuation> {
  const positions = await evmPositions(wallet);
  const networks: Record<string, number> = {};
  for (const p of positions) networks[p.network] = (networks[p.network] ?? 0) + p.valueUsd;
  positions.sort((a, b) => b.valueUsd - a.valueUsd);
  return { total: positions.reduce((s, p) => s + p.valueUsd, 0), top: positions.slice(0, TOP_POSITIONS), networks };
}

const SNAPSHOT_EVERY_MS = 60 * 60 * 1000;

async function snapshot(wallet: string, valueUsd: number) {
  const [last] = await db
    .select()
    .from(schema.walletSnapshots)
    .where(eq(schema.walletSnapshots.wallet, wallet))
    .orderBy(desc(schema.walletSnapshots.takenAt))
    .limit(1);
  if (!last || Date.now() - last.takenAt.getTime() > SNAPSHOT_EVERY_MS) {
    await db.insert(schema.walletSnapshots).values({ wallet, valueUsd });
  }
}

function valuate(wallet: string): Promise<Valuation> {
  return isEvmAddress(wallet) ? evmValuation(wallet) : solanaValuation(wallet);
}

/** Current value of one wallet (cached 2 min), recorded as an hourly snapshot. */
export function currentValue(wallet: string) {
  return cached<Valuation>(`wallet-v3:${wallet}`, 120, async () => {
    const v = await valuate(wallet);
    await snapshot(wallet, v.total);
    return v;
  });
}

type JupToken = { id: string; symbol: string; name: string; icon?: string; stats24h?: { priceChange?: number } };

/** Symbol, icon and 24h change for Solana mints (EVM positions already carry theirs). */
async function solanaMetadata(mints: string[]): Promise<Map<string, JupToken>> {
  if (mints.length === 0) return new Map();
  const key = [...mints].sort().join(",");
  const meta = await cached<JupToken[]>(`jup-tokens:${key}`, 600, () =>
    fetchJson<JupToken[]>(`${JUP}/tokens/v2/search?query=${key}`, { headers: jupHeaders() }),
  ).catch(() => [] as JupToken[]);
  return new Map(meta.map((m) => [m.id, m]));
}

/**
 * Sums snapshots of several wallets per hour. A wallet without a snapshot
 * yet for an hour counts with its closest known value, so adding a wallet
 * doesn't show up as a fake jump.
 */
function combineHistory(rows: { wallet: string; at: Date; valueUsd: number }[], wallets: string[]) {
  const hour = (d: Date) => Math.floor(d.getTime() / 3_600_000);
  const buckets = [...new Set(rows.map((r) => hour(r.at)))].sort((a, b) => a - b);
  const series = new Map(wallets.map((w) => [w, rows.filter((r) => r.wallet === w)]));
  return buckets.map((b) => {
    let sum = 0;
    for (const s of series.values()) {
      if (s.length === 0) continue;
      const before = s.filter((r) => hour(r.at) <= b);
      sum += (before[before.length - 1] ?? s[0]!).valueUsd;
    }
    return { at: new Date(b * 3_600_000), valueUsd: sum };
  });
}

/**
 * Combined value of any mix of Solana and EVM wallets plus the change over
 * the period, from our own hourly snapshots. History starts when a wallet
 * is first shown on FL3X.
 */
export async function getPortfolio(wallets: string[], period: PeriodId): Promise<PortfolioData> {
  const settled = await Promise.allSettled(wallets.map((w) => currentValue(w)));
  const valuations = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (wallets.length > 0 && valuations.length === 0) throw (settled[0] as PromiseRejectedResult).reason;

  const valueUsd = Math.round(valuations.reduce((s, v) => s + v.total, 0) * 100) / 100;

  // Same token across wallets is one holding.
  const merged = new Map<string, Position>();
  for (const v of valuations) {
    for (const p of v.top) {
      const prev = merged.get(p.id);
      merged.set(p.id, prev ? { ...prev, amount: prev.amount + p.amount, valueUsd: prev.valueUsd + p.valueUsd } : { ...p });
    }
  }
  const top = [...merged.values()].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, TOP_POSITIONS);
  const meta = await solanaMetadata(top.filter((p) => p.network === "solana").map((p) => p.id));
  const holdings = top.map((p) => {
    const m = meta.get(p.id);
    const sol = p.id === SOL_MINT;
    return {
      id: p.id,
      chain: p.network,
      symbol: sol ? "SOL" : (p.symbol ?? m?.symbol ?? `${p.id.slice(0, 4)}…`),
      name: sol ? "Solana" : (p.name ?? m?.name ?? "Unknown token"),
      iconUrl: p.iconUrl ?? m?.icon ?? null,
      amount: p.amount,
      valueUsd: p.valueUsd,
      change24h: m?.stats24h?.priceChange ?? null,
    };
  });

  const byNetwork: Record<string, number> = {};
  for (const v of valuations) for (const [n, usd] of Object.entries(v.networks)) byNetwork[n] = (byNetwork[n] ?? 0) + usd;
  const networks = Object.entries(byNetwork)
    .filter(([, usd]) => usd >= 0.01)
    .map(([id, usd]) => ({ id, name: id === "solana" ? "Solana" : evmNetworkName(id), valueUsd: usd }))
    .sort((a, b) => b.valueUsd - a.valueUsd);

  const days = PERIODS.find((p) => p.id === period)?.days ?? 7;
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = wallets.length
    ? await db
        .select({ wallet: schema.walletSnapshots.wallet, at: schema.walletSnapshots.takenAt, valueUsd: schema.walletSnapshots.valueUsd })
        .from(schema.walletSnapshots)
        .where(and(inArray(schema.walletSnapshots.wallet, wallets), gte(schema.walletSnapshots.takenAt, since)))
        .orderBy(asc(schema.walletSnapshots.takenAt))
    : [];
  const combined = combineHistory(rows, wallets);

  // Downsample to ~60 points for the chart.
  const step = Math.max(1, Math.ceil(combined.length / 60));
  const history = combined.filter((_, i) => i % step === 0).map((r) => ({ at: r.at.toISOString(), valueUsd: r.valueUsd }));
  history.push({ at: new Date().toISOString(), valueUsd });

  const first = combined[0];
  const changeUsd = first ? valueUsd - first.valueUsd : null;
  return {
    valueUsd,
    period,
    start: first ? { valueUsd: first.valueUsd, at: first.at.toISOString() } : null,
    changeUsd,
    changePct: first && first.valueUsd > 0 ? (changeUsd! / first.valueUsd) * 100 : null,
    history,
    holdings,
    networks,
    wallets: wallets.length,
  };
}

/** Hourly job: snapshot every wallet shown in a P&L, portfolio or holdings widget. */
export async function snapshotWallets(wallets: string[], log: (msg: string) => void) {
  for (const w of wallets) {
    try {
      await snapshot(w, (await valuate(w)).total);
    } catch (err) {
      log(`snapshot ${w} failed: ${(err as Error).message}`);
    }
  }
}
