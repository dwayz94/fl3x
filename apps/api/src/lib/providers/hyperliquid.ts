import type { HyperliquidData } from "@fl3x/shared";
import { cached, fetchJson } from "../cache";

const INFO = "https://api.hyperliquid.xyz/info";
const MAX_POSITIONS = 10;

type Num = string; // Hyperliquid sends every number as a decimal string

type ClearinghouseState = {
  marginSummary: { accountValue: Num };
  assetPositions: {
    position: { coin: string; szi: Num; entryPx: Num | null; positionValue: Num; unrealizedPnl: Num; leverage?: { type: string; value: number } };
  }[];
};

/** [window, { pnlHistory: [ms, cumulative pnl][] }]: day, week, month, allTime, plus perp-only twins (perpDay…). */
type Portfolio = [string, { pnlHistory: [number, Num][] }][];

type Account = Omit<HyperliquidData, "wallets">;

const info = <T>(body: object) =>
  fetchJson<T>(INFO, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });

/** P&L over a window: its history is cumulative from the window start, so last − first. */
function windowPnl(portfolio: Portfolio, name: string): number | null {
  const history = portfolio.find(([n]) => n === name)?.[1].pnlHistory;
  if (!history?.length) return null;
  return Number(history[history.length - 1]![1]) - Number(history[0]![1]);
}

/**
 * One address's perps account. P&L windows use the perp-only history
 * (perpDay…), so they match the account value, which is the perps account too.
 * An address that never used Hyperliquid just reads as an empty account.
 * Cached 1 min.
 */
function account(user: string) {
  return cached<Account>(`hyperliquid:${user}`, 60, async () => {
    const [state, portfolio] = await Promise.all([
      info<ClearinghouseState>({ type: "clearinghouseState", user }),
      info<Portfolio>({ type: "portfolio", user }).catch(() => [] as Portfolio),
    ]);
    const positions = state.assetPositions.flatMap(({ position: p }) => {
      const size = Number(p.szi);
      if (!size) return [];
      return [{
        coin: p.coin,
        side: size > 0 ? ("long" as const) : ("short" as const),
        size: Math.abs(size),
        entryPx: Number(p.entryPx ?? 0),
        valueUsd: Number(p.positionValue),
        unrealizedPnl: Number(p.unrealizedPnl),
        leverage: p.leverage?.value ?? null,
      }];
    });
    const pnl = (perp: string, both: string) => windowPnl(portfolio, perp) ?? windowPnl(portfolio, both);
    return {
      accountValue: Number(state.marginSummary.accountValue),
      unrealizedPnl: positions.reduce((s, p) => s + p.unrealizedPnl, 0),
      pnl: { day: pnl("perpDay", "day"), week: pnl("perpWeek", "week"), month: pnl("perpMonth", "month"), allTime: pnl("perpAllTime", "allTime") },
      positions,
    };
  });
}

const sumOrNull = (values: (number | null)[]) => (values.every((v) => v === null) ? null : values.reduce<number>((s, v) => s + (v ?? 0), 0));

/** Perps accounts of a member's EVM wallets, summed. Biggest positions first. */
export async function getHyperliquid(wallets: string[]): Promise<HyperliquidData> {
  const evm = wallets.filter((w) => w.startsWith("0x")).map((w) => w.toLowerCase());
  const accounts = await Promise.all(evm.map(account));
  return {
    accountValue: accounts.reduce((s, a) => s + a.accountValue, 0),
    unrealizedPnl: accounts.reduce((s, a) => s + a.unrealizedPnl, 0),
    pnl: {
      day: sumOrNull(accounts.map((a) => a.pnl.day)),
      week: sumOrNull(accounts.map((a) => a.pnl.week)),
      month: sumOrNull(accounts.map((a) => a.pnl.month)),
      allTime: sumOrNull(accounts.map((a) => a.pnl.allTime)),
    },
    positions: accounts.flatMap((a) => a.positions).sort((a, b) => b.valueUsd - a.valueUsd).slice(0, MAX_POSITIONS),
    wallets: evm.length,
  };
}
