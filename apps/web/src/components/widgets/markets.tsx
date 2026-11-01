"use client";

import type { HyperliquidData, PolymarketData, PortfolioData, TradesData, Widget } from "@fl3x/shared";
import { cn } from "@/lib/cn";
import { fmtPct, fmtUsd, fmtUsdCompact } from "@/lib/format";
import type { TokenData } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { usePortfolio } from "@/lib/use-portfolio";
import { useWalletWidget } from "@/lib/use-widget-data";
import { Avatar, WEmpty, WidgetFrame, WMuted, WSkeleton, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");
const UP = "#2FE3AC";
const DOWN = "#FF4D4D";
const signed = (v: number) => `${v >= 0 ? "+" : "−"}${fmtUsdCompact(Math.abs(v))}`;
const tone = (v: number) => (v >= 0 ? UP : DOWN);
/** Prices from $0.0000181 to $98,200: tiny ones keep 3 significant digits instead of rounding to $0.00 (never 1.8e-7). */
const tiny = new Intl.NumberFormat("en-US", { maximumSignificantDigits: 3, maximumFractionDigits: 20 });
const fmtPrice = (v: number) => (v >= 1 ? fmtUsd(v) : v === 0 ? "$0" : `$${tiny.format(v)}`);

function ago(iso: string) {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return `${Math.max(1, Math.round(s / 60))}m`;
  if (s < 86400) return `${Math.round(s / 3600)}h`;
  return `${Math.round(s / 86400)}d`;
}

/* ------------------------------------------------------------ allocation */

const SLICES = ["#FF97CB", "#9B7BFF", "#2FE3AC", "#FFB547"];
const OTHER = "rgba(255,255,255,0.22)";

/** Biggest bags as slices of the total (`count` of them); the rest is "Other". */
function slices(data: PortfolioData, count: number) {
  const total = data.valueUsd || 1;
  const top = data.holdings.slice(0, count).map((h, i) => ({ label: h.symbol, value: h.valueUsd, pct: (h.valueUsd / total) * 100, color: SLICES[i]! }));
  const rest = total - top.reduce((a, s) => a + s.value, 0);
  if (rest / total > 0.005) top.push({ label: "Other", value: rest, pct: (rest / total) * 100, color: OTHER });
  return top;
}

export function AllocationWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = usePortfolio(w, "1d");
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError) return <WEmpty size={w.size} label="Unavailable right now" />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a wallet in Settings" />;
  if (data.holdings.length === 0) return <WEmpty size={w.size} label="No tokens in these wallets yet" />;

  // Three bags + Other: four legend rows on the large card, two columns on the long one.
  const parts = slices(data, 3);
  let at = 0;
  const gradient = parts.map((p) => `${p.color} ${at}% ${(at += p.pct)}%`).join(", ");
  const donut = (size: string) => (
    <div className={cn("relative shrink-0 rounded-full", size)} style={{ background: `conic-gradient(${gradient})` }}>
      <div className="absolute inset-[22%] grid place-items-center rounded-full bg-[#171717]">
        <span className="font-primary text-sm leading-none">{fmtUsdCompact(data.valueUsd)}</span>
      </div>
    </div>
  );
  const legend = (
    <ul className={cn("grid min-w-0 flex-1 gap-x-3 gap-y-1", w.size === "long" && "grid-cols-2")}>
      {parts.map((p, i) => (
        <li key={i} className="flex min-w-0 items-center gap-1.5">
          <span className="size-2 shrink-0 rounded-full" style={{ background: p.color }} />
          <span className="truncate font-primary text-sm leading-none uppercase">{p.label}</span>
          <span className="ml-auto font-primary text-sm leading-none text-fg-2">{Math.round(p.pct)}%</span>
        </li>
      ))}
    </ul>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity}>
        {donut("size-16")}
        {legend}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="gap-3">
      <WMuted className="text-xs">Allocation</WMuted>
      <div className="flex justify-center">{donut("size-[78px]")}</div>
      {legend}
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------ best & worst */

export function MoversWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = usePortfolio(w, "1d");
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError) return <WEmpty size={w.size} label="Unavailable right now" />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a wallet in Settings" />;
  // Dollar move over 24h: a small coin up 300% matters less than a big bag up 10%.
  const moved = data.holdings
    .filter((h) => h.change24h != null && h.valueUsd > 1)
    .map((h) => ({ ...h, moveUsd: h.valueUsd - h.valueUsd / (1 + h.change24h! / 100) }))
    .sort((a, b) => b.moveUsd - a.moveUsd);
  if (moved.length === 0) return <WEmpty size={w.size} label="No price moves yet" />;
  const best = moved[0]!;
  const worst = moved.length > 1 ? moved[moved.length - 1]! : null;

  // Everything in one shrinking column: a long symbol or a big % gets cut, never pushes out of the card.
  const row = (label: string, h: (typeof moved)[number]) => (
    <div className="flex min-w-0 flex-1 items-center gap-2 overflow-hidden rounded-2xl bg-white/[0.05] px-2.5 py-2">
      <Avatar src={h.iconUrl} className="size-8 shrink-0 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] leading-none text-fg-2 uppercase">
          {label} · <span className="text-fg">{h.symbol}</span>
        </p>
        <p className="mt-1 truncate font-primary text-base leading-none" style={{ color: tone(h.change24h!) }}>
          {fmtPct(h.change24h!)}
          {w.size === "large" && <span className="ml-1.5 font-secondary text-[11px] text-fg-2">{signed(h.moveUsd)}</span>}
        </p>
      </div>
    </div>
  );
  return (
    <WidgetFrame size={w.size} opacity={opacity} className={w.size === "large" ? "gap-2" : "gap-2 p-2.5"}>
      {w.size === "large" && <WMuted className="text-xs">Last 24 hours</WMuted>}
      {row("Best", best)}
      {worst && row("Worst", worst)}
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------ P&L calendar */

/** Day-by-day change from the daily closes (UTC): close of each day minus the day before. */
function dailyChanges(daily: PortfolioData["daily"]) {
  const days = [...daily].sort((a, b) => a.day.localeCompare(b.day));
  return days.slice(1).map((d, i) => ({ day: d.day, change: d.valueUsd - days[i]!.valueUsd }));
}

export function CalendarWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = usePortfolio(w, "1m");
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError) return <WEmpty size={w.size} label="Unavailable right now" />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a wallet in Settings" />;

  const changes = dailyChanges(data.daily ?? []);
  const byDay = new Map(changes.map((c) => [c.day, c.change]));
  const biggest = Math.max(1, ...changes.map((c) => Math.abs(c.change)));
  // Large: five weeks. Long: the last three, so the squares fit the card's height and leave room for the total.
  const long = w.size === "long";
  const cells = long ? 21 : 35;
  const today = new Date();
  const days = Array.from({ length: cells }, (_, i) => {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - (cells - 1 - i));
    return d.toISOString().slice(0, 10);
  });
  // The total and green days cover what the squares show (30 days of data at most).
  const shown = long ? changes.filter((c) => days.includes(c.day)) : changes;
  const green = shown.filter((c) => c.change > 0).length;
  const total = shown.reduce((a, c) => a + c.change, 0);

  const grid = (
    <div className={cn("grid grid-cols-7", long ? "w-[130px] shrink-0 gap-[3px]" : "gap-1")}>
      {days.map((day) => {
        const c = byDay.get(day);
        const strength = c === undefined ? 0 : 0.25 + 0.75 * Math.min(1, Math.abs(c) / biggest);
        return (
          <span
            key={day}
            title={c === undefined ? day : `${day}: ${signed(c)}`}
            className="aspect-square rounded-[4px]"
            style={{ background: c === undefined ? "rgba(255,255,255,0.06)" : `color-mix(in srgb, ${tone(c)} ${Math.round(strength * 100)}%, transparent)` }}
          />
        );
      })}
    </div>
  );
  const head = (
    <div className="min-w-0">
      <p className="truncate font-primary text-xl leading-none" style={{ color: tone(total) }}>
        {signed(total)}
      </p>
      <p className="mt-1 truncate text-[11px] text-fg-2">
        {green} green day{green === 1 ? "" : "s"} · {long ? "3 weeks" : "30d"}
      </p>
    </div>
  );
  if (long) {
    return (
      <WidgetFrame size="long" opacity={opacity} className="justify-between gap-3">
        {head}
        {grid}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="gap-3">
      {head}
      <div className="mt-auto">{grid}</div>
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------ watchlist */

/** "addr1, addr2" → up to 4 addresses. */
const watchTokens = (v: unknown) =>
  str(v)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

function WatchRow({ chain, address, compact }: { chain: string; address: string; compact?: boolean }) {
  const { data, isLoading } = useData<TokenData>("token", { chain, address });
  if (isLoading) return <div className="h-9 animate-pulse rounded-xl bg-white/[0.05]" />;
  if (!data) return null;
  return (
    <div className={cn("flex min-w-0 items-center gap-2", compact && "flex-1")}>
      <Avatar src={data.imageUrl} className="size-7 rounded-full" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-primary text-base leading-none uppercase">{data.symbol}</p>
        <p className="text-[11px] leading-tight text-fg-2">{data.priceUsd != null ? fmtPrice(data.priceUsd) : "—"}</p>
      </div>
      {data.change24h != null && (
        <span className="font-primary text-sm" style={{ color: tone(data.change24h) }}>
          {fmtPct(data.change24h)}
        </span>
      )}
    </div>
  );
}

export function WatchlistWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const chain = str(w.settings.chain) || "solana";
  const tokens = watchTokens(w.settings.tokens);
  if (tokens.length === 0) return <WEmpty size={w.size} label="Add up to 4 token addresses" />;
  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} className="gap-4">
        {tokens.slice(0, 2).map((t) => (
          <WatchRow key={t} chain={chain} address={t} compact />
        ))}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="gap-2.5">
      <WMuted className="text-xs">Watchlist</WMuted>
      {tokens.map((t) => (
        <WatchRow key={t} chain={chain} address={t} />
      ))}
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------ recent trades */

export function TradesWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = useWalletWidget<TradesData>(w, "trades");
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError) return <WEmpty size={w.size} label="Trades unavailable right now" />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a Solana wallet in Settings" />;
  if (data.items.length === 0) return <WEmpty size={w.size} label="No swaps yet" />;

  const items = data.items.slice(0, w.size === "large" ? 4 : 2);
  const list = (
    <ul className="flex min-w-0 flex-1 flex-col gap-2">
      {items.map((t) => (
        <li key={t.id} className="flex min-w-0 items-center gap-2">
          <span className="w-9 shrink-0 rounded-md py-0.5 text-center font-primary text-[11px] leading-none text-bg" style={{ background: t.side === "buy" ? UP : DOWN }}>
            {t.side === "buy" ? "BUY" : "SELL"}
          </span>
          <Avatar src={t.token.iconUrl} className="size-6 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-primary text-sm leading-none uppercase">{t.token.symbol}</p>
            <p className="truncate text-[10px] leading-tight text-fg-2">
              {t.quote.amount.toLocaleString("en-US", { maximumFractionDigits: 2 })} {t.quote.symbol}
              {t.valueUsd != null && ` · ${fmtUsdCompact(t.valueUsd)}`}
            </p>
          </div>
          <span className="shrink-0 text-[11px] text-fg-3">{ago(t.at)}</span>
        </li>
      ))}
    </ul>
  );
  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity}>
        <WTitle className="w-16 shrink-0 text-base">Trades</WTitle>
        {list}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="gap-2.5">
      <WMuted className="text-xs">Recent trades</WMuted>
      {list}
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------ hyperliquid */

const HL = "#97FCE4";
const HL_LABEL: Record<string, string> = { day: "24H", week: "7D", month: "30D", allTime: "ALL TIME" };

export function HyperliquidWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const period = (str(w.settings.period) || "month") as keyof HyperliquidData["pnl"];
  const { data, isLoading, isError } = useWalletWidget<HyperliquidData>(w, "hyperliquid");
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError) return <WEmpty size={w.size} label="Hyperliquid unavailable right now" />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link an EVM wallet in Settings" />;

  const pnl = data.pnl[period];
  const head = (
    <div className="min-w-0">
      <p className="flex min-w-0 items-center gap-1.5 font-primary text-xs leading-none" style={{ color: HL }}>
        <span className="size-2 shrink-0 rounded-full" style={{ background: HL }} />
        <span className="truncate">HYPERLIQUID · {HL_LABEL[period]}</span>
      </p>
      <p className="mt-1.5 truncate font-primary text-[26px] leading-none" style={{ color: pnl == null ? undefined : tone(pnl) }}>
        {pnl == null ? "—" : signed(pnl)}
      </p>
      <p className="mt-1 truncate text-[11px] text-fg-2">Account {fmtUsdCompact(data.accountValue)}</p>
    </div>
  );
  const positions = data.positions.slice(0, w.size === "large" ? 3 : 2);
  const list = positions.length ? (
    <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
      {positions.map((p, i) => (
        <li key={`${p.coin}-${p.side}-${i}`} className="flex items-center gap-2 text-sm">
          <span className="font-primary leading-none">{p.coin}</span>
          <span className="rounded-md px-1.5 py-0.5 text-[10px] leading-none text-bg" style={{ background: p.side === "long" ? UP : DOWN }}>
            {p.side.toUpperCase()}
            {p.leverage ? ` ${p.leverage}x` : ""}
          </span>
          <span className="ml-auto font-primary leading-none" style={{ color: tone(p.unrealizedPnl) }}>
            {signed(p.unrealizedPnl)}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-xs text-fg-3">No open positions</p>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} className="gap-4">
        {head}
        <div className="ml-auto w-1/2 max-w-40 min-w-0">{list}</div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="gap-3">
      {head}
      <div className="mt-auto">{list}</div>
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------ polymarket */

const PM = "#5C7CFF";

export function PolymarketWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const user = str(w.settings.user).trim();
  const { data, isLoading, isError } = useData<PolymarketData>("polymarket", { user: user || undefined });
  if (!user) return <WEmpty size={w.size} label="Add your Polymarket wallet" />;
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError || !data) return <WEmpty size={w.size} label="Polymarket profile not found" />;

  const positions = data.positions.slice(0, w.size === "large" ? 3 : 2);
  const head = (
    <div className="shrink-0">
      <p className="font-primary text-xs leading-none" style={{ color: PM }}>
        POLYMARKET
      </p>
      <p className="mt-1.5 font-primary text-[24px] leading-none">{fmtUsdCompact(data.totalValue)}</p>
      <p className="mt-1 font-primary text-xs" style={{ color: tone(data.totalPnl) }}>
        {signed(data.totalPnl)}
      </p>
    </div>
  );
  const list = positions.length ? (
    <ul className="flex min-w-0 flex-1 flex-col gap-2">
      {positions.map((p) => (
        <li key={p.title + p.outcome} className="flex min-w-0 items-center gap-2">
          <Avatar src={p.icon} className="size-7 rounded-lg" />
          <div className="min-w-0 flex-1">
            <p className={cn("text-[11px] leading-tight", w.size === "large" ? "line-clamp-2" : "truncate")}>{p.title}</p>
            <p className="text-[10px] leading-tight text-fg-2">
              <span style={{ color: /^no$/i.test(p.outcome) ? DOWN : UP }}>{p.outcome}</span> · {Math.round(p.curPrice * 100)}¢
            </p>
          </div>
          <span className="shrink-0 font-primary text-sm" style={{ color: tone(p.pnl) }}>
            {fmtPct(p.pnlPct)}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-xs text-fg-3">No open bets</p>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={data.url} className="gap-4">
        {head}
        {list}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={data.url} className="gap-3">
      {head}
      <div className="mt-auto">{list}</div>
    </WidgetFrame>
  );
}
