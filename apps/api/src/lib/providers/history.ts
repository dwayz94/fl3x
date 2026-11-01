import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "../../db";
import { fetchJson } from "../cache";
import { isEvmAddress } from "../wallets";
import { archiveEndpoints, balancesOn, EVM_NETWORKS, units, type Network } from "./evm";
import { heliusKey, type HeliusTx } from "./trades";
import { currentValue, prices as jupiterPrices, rpc, SOL_MINT, solanaAccounts } from "./wallet";

/**
 * Rebuilds a wallet's past value from the chain, once, so a P&L or portfolio
 * widget shows the last days and months as soon as it's added (our hourly
 * snapshots only start then). Up to a year back:
 *
 * - Solana: today's balances, then the wallet's transactions replayed
 *   backwards (Helius when there's a key, else the RPC). No archive exists.
 * - EVM: balances read at past blocks on a free archive RPC (Ethereum, Base,
 *   Optimism, Polygon). Other networks keep today's amounts.
 * - Prices: DefiLlama's history; tokens it doesn't know (memecoins) are
 *   valued at the price of the wallet's own swaps, joined to today's price.
 *
 * The points land in wallet_snapshots, before the first real snapshot only.
 */

const HOUR = 3_600;
const DAY = 86_400;
const MAX_DAYS = 365;
/** Dense near now, sparse far back: 2 h for 2 days, 6 h for 2 weeks, daily for 3 months, weekly after. */
const SEGMENTS: [maxAge: number, step: number][] = [
  [2 * DAY, 2 * HOUR],
  [14 * DAY, 6 * HOUR],
  [90 * DAY, DAY],
  [MAX_DAYS * DAY, 7 * DAY],
];
const MAX_HELIUS_PAGES = 60; // 6,000 transactions
const MAX_RPC_TRANSACTIONS = 1_500; // the public RPC is slow: about 2 minutes at this cap
const STABLES = new Set(["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY35mCbcrRYFgmEp"]);

/** Moments to value, newest first, aligned to UTC so several wallets add up on the same points. */
export function historyGrid(nowSec: number): number[] {
  const out: number[] = [];
  let prev = HOUR; // the live value covers the last hour
  for (const [maxAge, step] of SEGMENTS) {
    for (let t = Math.floor((nowSec - prev) / step) * step; t > nowSec - maxAge; t -= step) out.push(t);
    prev = maxAge;
  }
  return [...new Set(out)].sort((a, b) => b - a);
}

/* ------------------------------------------------------------------ prices */

type Series = { t: number; price: number }[];

/** DefiLlama price history for coin keys ("solana:<mint>", "coingecko:ethereum", "base:0x…"), one series per key. */
async function llamaHistory(keys: string[], nowSec: number): Promise<Map<string, Series>> {
  const out = new Map<string, Series>();
  let prev = 0;
  for (const [maxAge, step] of SEGMENTS) {
    // On the grid's own steps (multiples of `step`), so each point finds its price.
    const start = Math.floor((nowSec - maxAge) / step) * step;
    const span = Math.ceil((maxAge - prev) / step) + 2;
    prev = maxAge;
    const period = step >= DAY ? `${step / DAY}d` : `${step / HOUR}h`;
    // DefiLlama answers at most 500 points per request (coins × span).
    const size = Math.max(1, Math.floor(500 / span));
    for (let i = 0; i < keys.length; i += size) {
      const batch = keys.slice(i, i + size);
      const url = `https://coins.llama.fi/chart/${batch.map(encodeURIComponent).join(",")}?start=${start}&span=${span}&period=${period}&searchWidth=${Math.max(600, step / 2)}`;
      // It also throttles bursts: retry with a pause, and space the requests out.
      for (let attempt = 0; attempt < 4; attempt++) {
        try {
          const res = await fetchJson<{ coins: Record<string, { prices: { timestamp: number; price: number }[] }> }>(url);
          for (const [key, v] of Object.entries(res.coins)) {
            const s = out.get(key) ?? [];
            for (const p of v.prices) s.push({ t: p.timestamp, price: p.price });
            out.set(key, s);
          }
          break;
        } catch {
          // After the last try a segment stays missing: those points fall back to the next source.
          await sleep(2_000 * 2 ** attempt);
        }
      }
      await sleep(200);
    }
  }
  for (const s of out.values()) s.sort((a, b) => a.t - b.t);
  return out;
}

/** Price at t from a series: the closest point within `width`, else null. */
function nearest(series: Series | undefined, t: number, width: number): number | null {
  if (!series?.length) return null;
  let best: { d: number; price: number } | null = null;
  for (const p of series) {
    const d = Math.abs(p.t - t);
    if (d <= width && (!best || d < best.d)) best = { d, price: p.price };
  }
  return best?.price ?? null;
}

/** Price at t between known points (swaps of the wallet, then today's price), joined by straight lines. */
function interpolate(series: Series | undefined, t: number): number | null {
  if (!series?.length) return null;
  if (t <= series[0]!.t) return series[0]!.price;
  for (let i = 1; i < series.length; i++) {
    const a = series[i - 1]!;
    const b = series[i]!;
    if (t <= b.t) return a.price + ((b.price - a.price) * (t - a.t)) / (b.t - a.t || 1);
  }
  return series[series.length - 1]!.price;
}

/* ------------------------------------------------------------------ solana */

/** One transaction's effect on the wallet: amount change per mint (SOL and wrapped SOL under SOL_MINT). */
type Move = { sig: string; t: number; deltas: Map<string, number> };

const add = (m: Map<string, number>, mint: string, n: number) => n && m.set(mint, (m.get(mint) ?? 0) + n);

/**
 * Transactions of `address` (the wallet, or one of its token accounts: a transfer in only
 * names the token account), read as changes to `wallet`'s balances.
 */
async function heliusMoves(address: string, wallet: string, key: string, since: number, maxPages = MAX_HELIUS_PAGES): Promise<{ moves: Move[]; reached: number }> {
  const moves: Move[] = [];
  let before: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const url = `https://api.helius.xyz/v0/addresses/${address}/transactions?api-key=${encodeURIComponent(key)}&limit=100${before ? `&before=${before}` : ""}`;
    let txs: HeliusTx[] | null = null;
    for (let attempt = 0; attempt < 4 && !txs; attempt++) txs = await fetchJson<HeliusTx[]>(url).catch(async () => (await sleep(1_500 * (attempt + 1)), null));
    // A page that won't load: the history starts after the last transaction read.
    if (!txs) {
      if (page === 0) throw new Error("Helius unreachable");
      return { moves, reached: moves.length ? moves[moves.length - 1]!.t : since };
    }
    if (txs.length === 0) return { moves, reached: since };
    for (const tx of txs) {
      if (tx.timestamp < since) return { moves, reached: since };
      const deltas = new Map<string, number>();
      for (const a of tx.accountData ?? []) {
        if (a.account === wallet) add(deltas, SOL_MINT, a.nativeBalanceChange / 1e9);
        for (const c of a.tokenBalanceChanges ?? []) if (c.userAccount === wallet) add(deltas, c.mint, Number(c.rawTokenAmount.tokenAmount) / 10 ** c.rawTokenAmount.decimals);
      }
      if (deltas.size) moves.push({ sig: tx.signature, t: tx.timestamp, deltas });
    }
    before = txs[txs.length - 1]!.signature;
  }
  // Too many transactions to read them all: the history starts at the oldest one read.
  return { moves, reached: moves.length ? moves[moves.length - 1]!.t : since };
}

type ParsedTx = {
  blockTime: number | null;
  transaction: { message: { accountKeys: { pubkey: string }[] } };
  meta: {
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: { owner?: string; mint: string; uiTokenAmount: { uiAmountString?: string } }[];
    postTokenBalances?: { owner?: string; mint: string; uiTokenAmount: { uiAmountString?: string } }[];
  } | null;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** The public RPC answers 429 under load: wait and retry a few times. */
async function patientRpc<T>(method: string, params: unknown[]): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await rpc<T>(method, params);
    } catch (err) {
      if (attempt >= 6) throw err;
      await sleep(Math.min(30_000, 1_000 * 2 ** attempt));
    }
  }
}

async function rpcMoves(address: string, wallet: string, since: number, cap = MAX_RPC_TRANSACTIONS): Promise<{ moves: Move[]; reached: number }> {
  const sigs: { signature: string; blockTime: number | null }[] = [];
  let before: string | undefined;
  let capped = false;
  for (;;) {
    const page = await patientRpc<{ signature: string; blockTime: number | null }[]>("getSignaturesForAddress", [address, { limit: 1000, ...(before && { before }) }]);
    const recent = page.filter((s) => (s.blockTime ?? 0) >= since);
    sigs.push(...recent);
    if (sigs.length >= cap) {
      capped = true;
      sigs.length = cap;
      break;
    }
    if (page.length < 1000 || recent.length < page.length) break;
    before = page[page.length - 1]!.signature;
  }

  const moves: Move[] = [];
  // Newest first, a few at a time (the public RPC rate-limits per IP). If one can't be read,
  // the history stops there: everything before it would be off.
  for (let i = 0; i < sigs.length; i += 3) {
    const window = sigs.slice(i, i + 3);
    const read = await Promise.allSettled(window.map((s) => patientRpc<ParsedTx | null>("getTransaction", [s.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }])));
    const broken = read.findIndex((r) => r.status === "rejected");
    read.forEach((r, j) => {
      if (r.status !== "fulfilled" || (broken >= 0 && j >= broken)) return;
      const tx = r.value;
      if (!tx?.meta || !tx.blockTime) return;
      const deltas = new Map<string, number>();
      const k = tx.transaction.message.accountKeys.findIndex((a) => a.pubkey === wallet);
      if (k >= 0) add(deltas, SOL_MINT, ((tx.meta.postBalances[k] ?? 0) - (tx.meta.preBalances[k] ?? 0)) / 1e9);
      for (const b of tx.meta.postTokenBalances ?? []) if (b.owner === wallet) add(deltas, b.mint, Number(b.uiTokenAmount.uiAmountString ?? 0));
      for (const b of tx.meta.preTokenBalances ?? []) if (b.owner === wallet) add(deltas, b.mint, -Number(b.uiTokenAmount.uiAmountString ?? 0));
      if (deltas.size) moves.push({ sig: window[j]!.signature, t: tx.blockTime, deltas });
    });
    if (broken >= 0) return { moves, reached: (window[broken]!.blockTime ?? since) + 1 };
    await sleep(250);
  }
  return { moves, reached: capped && moves.length ? moves[moves.length - 1]!.t : since };
}

/** Price of a token at each swap of the wallet: what it paid or got in SOL or a stablecoin, per token. */
function swapPrices(moves: Move[], sol: Series | undefined): Map<string, Series> {
  const out = new Map<string, Series>();
  for (const m of moves) {
    const tokens = [...m.deltas].filter(([mint, n]) => mint !== SOL_MINT && !STABLES.has(mint) && n !== 0);
    if (tokens.length !== 1) continue;
    const [mint, amount] = tokens[0]!;
    const stable = [...m.deltas].find(([mint, n]) => STABLES.has(mint) && Math.sign(n) === -Math.sign(amount));
    const solMove = m.deltas.get(SOL_MINT) ?? 0;
    let usd: number | null = null;
    if (stable) usd = Math.abs(stable[1]);
    // Under 0.01 SOL it's fees and rent, not a price.
    else if (Math.sign(solMove) === -Math.sign(amount) && Math.abs(solMove) >= 0.01) {
      const solPrice = nearest(sol, m.t, 6 * HOUR) ?? interpolate(sol, m.t);
      if (solPrice) usd = Math.abs(solMove) * solPrice;
    }
    if (usd == null) continue;
    const s = out.get(mint) ?? [];
    s.push({ t: m.t, price: usd / Math.abs(amount) });
    out.set(mint, s);
  }
  for (const s of out.values()) s.sort((a, b) => a.t - b.t);
  return out;
}

async function solanaHistory(wallet: string, grid: number[], nowSec: number): Promise<{ values: Map<number, number>; from: number }> {
  const since = grid[grid.length - 1]!;
  const { balances, accounts } = await solanaAccounts(wallet);
  const today = await jupiterPrices([SOL_MINT, ...[...balances.keys()].filter((m) => m !== SOL_MINT)]).catch(() => ({ prices: {} as Record<string, number> }));
  const key = heliusKey();
  const read = (address: string, small: boolean) =>
    key ? heliusMoves(address, wallet, key, since, small ? 10 : MAX_HELIUS_PAGES) : rpcMoves(address, wallet, since, small ? 300 : MAX_RPC_TRANSACTIONS);
  // Tokens received by transfer only show up on the token account: read the ones worth something today.
  const valued = accounts
    .map((a) => ({ ...a, usd: a.amount * (today.prices[a.mint] ?? 0) }))
    .filter((a) => a.mint !== SOL_MINT && a.usd >= 10)
    .sort((a, b) => b.usd - a.usd)
    .slice(0, 8);
  const own = await read(wallet, false);
  const extra = [];
  for (const a of valued) extra.push(await read(a.pubkey, true));
  // The same transaction can come from several addresses: once each.
  const seen = new Set<string>();
  const moves = [own, ...extra]
    .flatMap((r) => r.moves)
    .filter((m) => !seen.has(m.sig) && seen.add(m.sig))
    .sort((a, b) => b.t - a.t);
  const reached = Math.max(own.reached, ...extra.map((r) => r.reached));

  // Walk back in time: before each transaction, the wallet held its balance minus what the transaction brought.
  const held = new Map<number, Map<string, number>>();
  const now = new Map(balances);
  let i = 0;
  for (const t of grid) {
    if (t < reached) break;
    for (; i < moves.length && moves[i]!.t > t; i++) for (const [mint, n] of moves[i]!.deltas) now.set(mint, (now.get(mint) ?? 0) - n);
    held.set(t, new Map([...now].filter(([, n]) => n > 1e-9)));
  }

  // Only tokens with a price somewhere (today, or in the wallet's swaps): spam airdrops stay out of DefiLlama.
  const traded = new Set(moves.flatMap((m) => [...m.deltas.keys()]));
  const mints = [...new Set([...held.values()].flatMap((m) => [...m.keys()]))].filter((m) => m !== SOL_MINT && (today.prices[m] || traded.has(m)));
  const llama = await llamaHistory([`solana:${SOL_MINT}`, ...mints.slice(0, 300).map((m) => `solana:${m}`)], nowSec);
  const sol = llama.get(`solana:${SOL_MINT}`);
  // Without SOL's past price every point would be off: fail, and retry later rather than store zeros.
  if (!sol?.length) throw new Error("No SOL price history");
  const swaps = swapPrices(moves, sol);
  // Today's price closes each swap series, so a token still held joins its current value.
  for (const [mint, s] of swaps) if (today.prices[mint]) s.push({ t: nowSec, price: today.prices[mint]! });

  const values = new Map<number, number>();
  for (const [t, amounts] of held) {
    let total = 0;
    for (const [mint, amount] of amounts) {
      const price = nearest(llama.get(`solana:${mint}`), t, 12 * HOUR) ?? interpolate(swaps.get(mint), t) ?? 0;
      total += amount * price;
    }
    values.set(t, total);
  }
  return { values, from: Math.max(reached, since) };
}

/* --------------------------------------------------------------------- evm */

/** Block at a moment, from the network's average block time (close enough for these points). */
async function blockClock(n: Network, url: string): Promise<(t: number) => number> {
  type Block = { number: string; timestamp: string };
  const call = (params: unknown[]) =>
    fetchJson<{ result: Block }>(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params }) }).then((r) => ({
      number: Number(BigInt(r.result.number)),
      time: Number(BigInt(r.result.timestamp)),
    }));
  const head = await call(["latest", false]);
  const back = await call([`0x${Math.max(1, head.number - 200_000).toString(16)}`, false]);
  const perBlock = (head.time - back.time) / (head.number - back.number);
  return (t) => Math.max(1, Math.round(head.number - (head.time - t) / perBlock));
}

async function evmHistory(wallet: string, grid: number[], nowSec: number, live: number): Promise<{ values: Map<number, number>; from: number }> {
  // amounts[t] = price key → amount; `current` = the same tokens today
  const amounts = new Map<number, Map<string, number>>(grid.map((t) => [t, new Map()]));
  const current = new Map<string, number>();
  const put = (t: number, key: string, n: number) => n > 0 && amounts.get(t)!.set(key, (amounts.get(t)!.get(key) ?? 0) + n);
  const keysOf = (n: Network) => [n.native.llama, ...n.tokens.map(([address, , , priceKey]) => priceKey ?? `${n.llama}:${address}`)];

  await Promise.all(
    EVM_NETWORKS.map(async (n) => {
      const latest = await balancesOn(n, wallet).catch(() => null);
      if (!latest) return;
      const keys = keysOf(n);
      const read = (b: { native: bigint; tokens: bigint[] }) => [units(b.native, 18), ...b.tokens.map((raw, j) => units(raw, n.tokens[j]![2]))];
      const nowAmounts = read(latest);
      nowAmounts.forEach((a, j) => a > 0 && current.set(keys[j]!, (current.get(keys[j]!) ?? 0) + a));
      const nonce = await fetchJson<{ result: string }>(n.rpc, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getTransactionCount", params: [wallet, "latest"] }),
      })
        .then((r) => Number(BigInt(r.result)))
        .catch(() => 1);
      // Never used on this network: nothing to rebuild.
      if (nonce === 0 && nowAmounts.every((a) => a === 0)) return;

      // The first archive that tells block times (Alchemy when enabled for this network, else dRPC).
      let blockAt: ((t: number) => number) | null = null;
      for (const e of archiveEndpoints(n)) {
        blockAt = await blockClock(n, e.url).catch(() => null);
        if (blockAt) break;
      }
      if (!blockAt) {
        // No archive: today's amounts, valued at past prices.
        for (const t of grid) nowAmounts.forEach((a, j) => put(t, keys[j]!, a));
        return;
      }
      const queue = [...grid];
      await Promise.all(
        Array.from({ length: 3 }, async () => {
          for (let t = queue.shift(); t !== undefined; t = queue.shift()) {
            let past: number[] | null = null;
            for (let attempt = 0; attempt < 3 && !past; attempt++) {
              past = await balancesOn(n, wallet, blockAt(t))
                .then(read)
                .catch(async () => (await sleep(800 * (attempt + 1)), null));
            }
            // Unreadable point: today's amounts rather than a fake drop to zero.
            (past ?? nowAmounts).forEach((a, j) => put(t, keys[j]!, a));
          }
        }),
      );
    }),
  );

  const keys = [...new Set([...amounts.values(), current].flatMap((m) => [...m.keys()]))];
  const llama = await llamaHistory(keys, nowSec);
  const worth = (held: Map<string, number>, t: number) => [...held].reduce((sum, [key, amount]) => sum + amount * (nearest(llama.get(key), t, 4 * DAY) ?? 0), 0);
  // What the live value counts beyond these tokens (Moralis sees every token, the past reads only the known ones): held as is.
  const unseen = Math.max(0, live - worth(current, nowSec));
  const values = new Map<number, number>();
  for (const [t, held] of amounts) values.set(t, worth(held, t) + unseen);
  return { values, from: grid[grid.length - 1]! };
}

/* ------------------------------------------------------------------- runner */

/** EVM rebuilds are off until they're reliable (the archive reads stall on busy wallets): EVM history starts at the first snapshot. */
const EVM_HISTORY = false;

const RETRY_FAILED_MS = 6 * 3_600_000;
/** Wallets settled in this process (done, or failed recently): no database read on every widget view. */
const settled = new Set<string>();
const queued = new Map<string, Promise<void>>();
/** One rebuild at a time: each one is heavy (Helius pages, DefiLlama), and live widget reads share those APIs. */
let chain: Promise<unknown> = Promise.resolve();

/** Forget a wallet's rebuilt past and redo it (from /admin, after a fix or a data issue). */
export async function rebuildHistory(wallet: string, log: (msg: string) => void = () => {}) {
  // Let a run in progress finish first: it would mark the wallet done again after the reset.
  await queued.get(wallet);
  await db.delete(schema.walletBackfills).where(eq(schema.walletBackfills.wallet, wallet));
  settled.delete(wallet);
  void ensureHistory(wallet, log);
}

/**
 * Rebuild this wallet's past once, queued behind the others. Safe to call on
 * every widget read; never throws (it runs detached).
 */
export function ensureHistory(wallet: string, log: (msg: string) => void = () => {}): Promise<void> {
  if ((!EVM_HISTORY && isEvmAddress(wallet)) || settled.has(wallet)) return Promise.resolve();
  const pending = queued.get(wallet);
  if (pending) return pending;
  const job = chain
    .then(() => runOnce(wallet, log))
    .catch((err) => log(`history ${wallet} failed: ${(err as Error).message}`))
    .finally(() => queued.delete(wallet));
  chain = job;
  queued.set(wallet, job);
  return job;
}

async function runOnce(wallet: string, log: (msg: string) => void) {
  const [done] = await db.select().from(schema.walletBackfills).where(eq(schema.walletBackfills.wallet, wallet)).limit(1);
  if (done && (done.status === "done" || Date.now() - done.finishedAt.getTime() < RETRY_FAILED_MS)) {
    if (done.status === "done") settled.add(wallet);
    return;
  }
  try {
    const started = Date.now();
    const points = await backfill(wallet);
    settled.add(wallet);
    log(`history ${wallet}: ${points} points in ${Math.round((Date.now() - started) / 1000)}s`);
  } catch (err) {
    log(`history ${wallet} failed: ${(err as Error).message}`);
    await db
      .insert(schema.walletBackfills)
      .values({ wallet, status: "failed" })
      .onConflictDoUpdate({ target: schema.walletBackfills.wallet, set: { status: "failed", finishedAt: new Date() } });
  }
}

async function backfill(wallet: string) {
  const nowSec = Math.floor(Date.now() / 1000);
  const [first] = await db
    .select({ at: schema.walletSnapshots.takenAt })
    .from(schema.walletSnapshots)
    .where(and(eq(schema.walletSnapshots.wallet, wallet), eq(schema.walletSnapshots.rebuilt, false)))
    .orderBy(asc(schema.walletSnapshots.takenAt))
    .limit(1);
  // Only before what we recorded live ourselves.
  const until = first ? Math.floor(first.at.getTime() / 1000) : nowSec;
  const grid = historyGrid(nowSec).filter((t) => t < until);
  if (grid.length === 0) return markDone(wallet, null, 0).then(() => 0);

  const { values, from } = isEvmAddress(wallet) ? await evmHistory(wallet, grid, nowSec, (await currentValue(wallet)).total) : await solanaHistory(wallet, grid, nowSec);
  const rows = [...values].filter(([t]) => t >= from).map(([t, valueUsd]) => ({ wallet, valueUsd, takenAt: new Date(t * 1000), rebuilt: true }));
  await db.transaction(async (tx) => {
    // A rerun replaces its own points, never the live ones.
    await tx.delete(schema.walletSnapshots).where(and(eq(schema.walletSnapshots.wallet, wallet), eq(schema.walletSnapshots.rebuilt, true)));
    for (let i = 0; i < rows.length; i += 200) await tx.insert(schema.walletSnapshots).values(rows.slice(i, i + 200));
  });
  await markDone(wallet, rows.length ? new Date(from * 1000) : null, rows.length);
  return rows.length;
}

function markDone(wallet: string, fromAt: Date | null, points: number) {
  return db
    .insert(schema.walletBackfills)
    .values({ wallet, status: "done", fromAt, points })
    .onConflictDoUpdate({ target: schema.walletBackfills.wallet, set: { status: "done", fromAt, points, finishedAt: new Date() } });
}
