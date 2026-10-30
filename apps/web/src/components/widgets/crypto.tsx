"use client";

import type { Widget } from "@fl3x/shared";
import { fmtPct, fmtUsd, fmtUsdCompact, splitUsd } from "@/lib/format";
import type { TokenData } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { useNfts } from "@/lib/use-nfts";
import { usePortfolio } from "@/lib/use-portfolio";
import { Avatar, WEmpty, WidgetFrame, WMuted, WPill, WSkeleton, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");

function SolMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 20" className={className} aria-hidden fill="currentColor">
      <path d="M4 15h18l-3 4H1zM4 1h18l-3 4H1zM1 8h18l3 4H4z" />
    </svg>
  );
}

function periodLabel(id: string) {
  return { "1d": "Today", "7d": "This week", "14d": "Last 14 days", "1m": "This month", "1y": "This year" }[id] ?? id;
}

export function PnlWidget({ w }: { w: Widget }) {
  const period = str(w.settings.period) || "1m";
  const accent = str(w.settings.accent) || "#2FE3AC";
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading } = usePortfolio(w, period);
  if (isLoading) return <WSkeleton size={w.size} />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a wallet in Settings" />;

  const change = data.changeUsd ?? 0;
  const positive = change >= 0;
  const color = positive ? accent : "#FF4D4D";
  const badge = (
    <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-bg" style={{ background: color }}>
      <SolMark className="h-4 w-5" />
      <span className="font-primary text-2xl leading-none whitespace-nowrap">
        {positive ? "+" : "−"}
        {fmtUsd(Math.abs(change)).replace("$", "")}
      </span>
    </div>
  );
  const rows = (
    <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-primary text-sm">
      <dt className="text-fg-2">P&amp;L</dt>
      <dd className="text-right" style={{ color }}>{data.changePct != null ? fmtPct(data.changePct) : "—"}</dd>
      <dt className="text-fg-2">Start</dt>
      <dd className="text-right">{data.start ? fmtUsdCompact(data.start.valueUsd) : "—"}</dd>
      <dt className="text-fg-2">End</dt>
      <dd className="text-right">{fmtUsdCompact(data.valueUsd)}</dd>
    </dl>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity}>
        <div className="flex flex-col gap-1.5">
          <WMuted>{periodLabel(period)}</WMuted>
          {badge}
        </div>
        <div className="ml-auto w-28">{rows}</div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="items-center gap-2">
      <WMuted className="text-xs">{periodLabel(period)}</WMuted>
      {badge}
      <div className="mt-auto w-full px-1">{rows}</div>
    </WidgetFrame>
  );
}

export function TokenWidget({ w }: { w: Widget }) {
  const chain = str(w.settings.chain) || "solana";
  const address = str(w.settings.address);
  const note = str(w.settings.note);
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = useData<TokenData>("token", { chain, address });
  if (!address) return <WEmpty size={w.size} label="Add a token address" />;
  if (isError) return <WEmpty size={w.size} label="Token not found" />;
  if (isLoading || !data) return <WSkeleton size={w.size} />;

  const mc = data.marketCap != null && (
    <span className={`font-primary text-lg leading-none ${data.change24h != null && data.change24h < 0 ? "text-danger" : "text-success"}`}>
      {fmtUsdCompact(data.marketCap).replace("$", "")} <span className="text-xs">MC</span>
    </span>
  );
  const head = (
    <div className="flex items-center gap-2">
      <Avatar src={data.imageUrl} className="size-11" />
      <div className="min-w-0">
        <WTitle>{data.symbol}</WTitle>
        <WMuted className="truncate">{data.name}</WMuted>
      </div>
    </div>
  );
  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={data.url}>
        <Avatar src={data.imageUrl} className="size-[60px]" />
        <div className="min-w-0 flex-1">
          <WTitle>
            {data.symbol} <span className="text-[10px] text-fg-2">{data.name}</span>
          </WTitle>
          {note && <p className="line-clamp-2 text-[10px] text-fg-2">“{note}”</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {mc}
          <WPill>Buy</WPill>
        </div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={data.url}>
      {head}
      {note && <p className="mt-2 line-clamp-4 text-[10px] text-fg-2">“{note}”</p>}
      <div className="mt-auto flex items-center justify-between">
        {mc}
        <WPill>Buy</WPill>
      </div>
    </WidgetFrame>
  );
}

const amount = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

export function HoldingsWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading } = usePortfolio(w, "1d");
  if (isLoading) return <WSkeleton size={w.size} />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a wallet in Settings" />;

  const [whole, cents] = splitUsd(data.valueUsd);
  const change = data.changeUsd ?? 0;
  const holdings = (data.holdings ?? []).slice(0, w.size === "long" ? 2 : 3);
  const total = (
    <div>
      <p className="font-primary text-[28px] leading-none">
        {whole}
        <span className="text-fg-3">{cents}</span>
      </p>
      <p className="mt-1 font-primary text-xs">
        <span className={change >= 0 ? "text-success" : "text-danger"}>
          {change >= 0 ? "+" : "−"}
          {fmtUsd(Math.abs(change))}
        </span>{" "}
        <span className="text-fg-2">24H</span>
      </p>
    </div>
  );
  const list = (
    <ul className="flex min-w-0 flex-1 flex-col gap-1.5">
      {holdings.map((h) => (
        <li key={h.id} className="flex items-center gap-2">
          <Avatar src={h.iconUrl} className="size-7 rounded-full" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-primary text-sm leading-none uppercase">{h.symbol}</p>
            <p className="text-[9px] leading-tight text-fg-2">{amount.format(h.amount)}</p>
          </div>
          <div className="text-right">
            <p className="font-primary text-sm leading-none">{fmtUsdCompact(h.valueUsd)}</p>
            {h.change24h != null && (
              <p className={`text-[9px] leading-tight ${h.change24h >= 0 ? "text-success" : "text-danger"}`}>{fmtPct(h.change24h)}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} className="gap-4">
        {total}
        {list}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="gap-3">
      {total}
      {list}
    </WidgetFrame>
  );
}

/** NFT gallery: a 2×2 grid (large) or a row of four (long), with the count. */
export function NftWidget({ w }: { w: Widget }) {
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading, isError } = useNfts(w);
  if (isLoading) return <WSkeleton size={w.size} />;
  if (isError) return <WEmpty size={w.size} label="NFTs unavailable right now" />;
  if (!data || data.wallets === 0) return <WEmpty size={w.size} label="Link a Solana wallet in Settings" />;
  if (data.items.length === 0) return <WEmpty size={w.size} label="No NFTs in these wallets" />;

  const shown = data.items.slice(0, 4);
  const tile = (n: (typeof shown)[number]) => (
    <div key={n.id} className="relative aspect-square min-w-0 overflow-hidden rounded-xl bg-white/5" title={n.collection ? `${n.name} · ${n.collection}` : n.name}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={n.image} alt={n.name} loading="lazy" className="size-full object-cover" />
    </div>
  );
  const count = (
    <p className="font-primary text-sm leading-none">
      {data.total} <span className="text-fg-2">NFT{data.total === 1 ? "" : "S"}</span>
    </p>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity}>
        <div className="flex w-16 shrink-0 flex-col gap-1">
          <WTitle className="text-base">NFTs</WTitle>
          {count}
        </div>
        <div className="grid min-w-0 flex-1 grid-cols-4 gap-2">{shown.map(tile)}</div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity}>
      <div className="mb-2 flex items-baseline justify-between">
        <WTitle className="text-base">NFTs</WTitle>
        {count}
      </div>
      <div className="grid flex-1 grid-cols-2 gap-2">{shown.map(tile)}</div>
    </WidgetFrame>
  );
}
