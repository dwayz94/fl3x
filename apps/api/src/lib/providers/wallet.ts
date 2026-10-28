import { and, asc, desc, eq, gte } from "drizzle-orm";
import { PERIODS, type PeriodId } from "@fl3x/shared";
import { db, schema } from "../../db";
import { env } from "../../env";
import { cached, fetchJson } from "../cache";

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

// Jupiter Price API v3: https://dev.jup.ag/docs/price
// Free host without a key; api.jup.ag with JUPITER_API_KEY for higher limits.
const JUP_PRICE = env.JUPITER_API_KEY ? "https://api.jup.ag/price/v3" : "https://lite-api.jup.ag/price/v3";
const MAX_PRICED_MINTS = 200; // spam-token wallets can hold thousands

async function prices(mints: string[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  const list = mints.slice(0, MAX_PRICED_MINTS);
  for (let i = 0; i < list.length; i += 50) {
    const ids = list.slice(i, i + 50).join(",");
    try {
      const res = await fetchJson<Record<string, { usdPrice?: number }>>(`${JUP_PRICE}?ids=${ids}`, {
        headers: env.JUPITER_API_KEY ? { "x-api-key": env.JUPITER_API_KEY } : {},
      });
      for (const [mint, p] of Object.entries(res)) if (p?.usdPrice) out[mint] = p.usdPrice;
    } catch (err) {
      // SOL is in the first batch: without it the value is meaningless.
      if (i === 0) throw err;
    }
  }
  return out;
}

/** USD value of SOL + every priced SPL / Token-2022 balance. */
async function valueOf(wallet: string): Promise<number> {
  const [lamports, ...accounts] = await Promise.all([
    rpc<{ value: number }>("getBalance", [wallet]),
    ...TOKEN_PROGRAMS.map((programId) =>
      rpc<TokenAccounts>("getTokenAccountsByOwner", [wallet, { programId }, { encoding: "jsonParsed" }]),
    ),
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
  let total = 0;
  for (const [mint, amount] of balances) total += amount * (p[mint] ?? 0);
  return Math.round(total * 100) / 100;
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

export function currentValue(wallet: string) {
  return cached<number>(`wallet:${wallet}`, 120, async () => {
    const v = await valueOf(wallet);
    await snapshot(wallet, v);
    return v;
  });
}

export interface WalletData {
  wallet: string;
  valueUsd: number;
  period: PeriodId;
  start: { valueUsd: number; at: string } | null;
  changeUsd: number | null;
  changePct: number | null;
  history: { at: string; valueUsd: number }[];
}

/**
 * Current value plus the change over the period, from our own hourly
 * snapshots. A wallet only has history from the moment it was first shown
 * on FL3X; until then `start` is the earliest snapshot we have.
 */
export async function getWallet(wallet: string, period: PeriodId): Promise<WalletData> {
  const valueUsd = await currentValue(wallet);
  const days = PERIODS.find((p) => p.id === period)?.days ?? 7;
  const since = new Date(Date.now() - days * 86_400_000);
  const rows = await db
    .select({ at: schema.walletSnapshots.takenAt, valueUsd: schema.walletSnapshots.valueUsd })
    .from(schema.walletSnapshots)
    .where(and(eq(schema.walletSnapshots.wallet, wallet), gte(schema.walletSnapshots.takenAt, since)))
    .orderBy(asc(schema.walletSnapshots.takenAt));

  // Downsample to ~60 points for the sparkline.
  const step = Math.max(1, Math.ceil(rows.length / 60));
  const history = rows.filter((_, i) => i % step === 0).map((r) => ({ at: r.at.toISOString(), valueUsd: r.valueUsd }));
  history.push({ at: new Date().toISOString(), valueUsd });

  const first = rows[0];
  const changeUsd = first ? valueUsd - first.valueUsd : null;
  return {
    wallet,
    valueUsd,
    period,
    start: first ? { valueUsd: first.valueUsd, at: first.at.toISOString() } : null,
    changeUsd,
    changePct: first && first.valueUsd > 0 ? (changeUsd! / first.valueUsd) * 100 : null,
    history,
  };
}

/** Hourly job: snapshot every wallet shown in a P&L or portfolio widget. */
export async function snapshotTrackedWallets(log: (msg: string) => void) {
  const rows = await db.select({ settings: schema.widgets.settings }).from(schema.widgets);
  const wallets = new Set(rows.map((r) => r.settings.wallet).filter((w): w is string => typeof w === "string" && w.length > 0));
  for (const w of wallets) {
    try {
      await snapshot(w, await valueOf(w));
    } catch (err) {
      log(`snapshot ${w} failed: ${(err as Error).message}`);
    }
  }
}
