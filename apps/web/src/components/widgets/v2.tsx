"use client";

/**
 * V2 renderers. They sit next to the originals (picked with the widget's
 * "style" setting) so V1 stays untouched while the new designs are reviewed.
 */

import { useEffect, useId, useState } from "react";
import {
  ArrowDownRight01Icon, ArrowUpRight01Icon, InstagramIcon, Moon02Icon, NewTwitterIcon, PlayIcon, SpotifyIcon, Sun03Icon,
  TiktokIcon, TwitchIcon, YoutubeIcon,
} from "@hugeicons/core-free-icons";
import { PERIODS, type Widget } from "@fl3x/shared";
import { Flag, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtCompact, fmtNumber, fmtPct, fmtUsd, splitUsd } from "@/lib/format";
import type { MediaData, WalletData } from "@/lib/types";
import { useData } from "@/lib/use-data";
import { WEmpty, WidgetFrame, WMuted, WPill, WSkeleton, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");

/* ------------------------------------------------------------------ chart */

/** Catmull-Rom spline through the points, as cubic Béziers (smooth, no overshoot on dense data). */
function smoothPath(pts: readonly (readonly [number, number])[]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0]![0]},${pts[0]![1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i]!;
    const p1 = pts[i]!;
    const p2 = pts[i + 1]!;
    const p3 = pts[i + 2] ?? p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0]!.toFixed(2)},${c1[1]!.toFixed(2)} ${c2[0]!.toFixed(2)},${c2[1]!.toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return d;
}

/**
 * Smooth area chart with a glowing line, a dashed start baseline and a
 * live dot on the last value. Fills its container edge to edge.
 */
function AreaChart({ values: raw, color, className }: { values: number[]; color: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (raw.length < 2) return null;
  // Light 3-point moving average: hourly snapshots are noisy, the trend is what matters. Last value stays exact.
  const values = raw.map((v, i) => (i === 0 || i === raw.length - 1 ? v : (raw[i - 1]! + v + raw[i + 1]!) / 3));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  // Leave headroom so the line never touches the top edge.
  const y = (v: number) => 92 - ((v - min) / span) * 72;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * 100, y(v)] as const);
  const line = smoothPath(pts);
  const last = pts[pts.length - 1]!;
  const base = y(values[0]!);

  return (
    <div className={cn("pointer-events-none", className)} aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full overflow-visible">
        <defs>
          <linearGradient id={`f${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="70%" stopColor={color} stopOpacity="0.06" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id={`g${id}`} x="-10%" y="-50%" width="120%" height="200%">
            <feGaussianBlur stdDeviation="2.5" />
          </filter>
        </defs>
        <line x1="0" x2="100" y1={base} y2={base} stroke="white" strokeOpacity="0.18" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        <path d={`${line} L100,100 L0,100 Z`} fill={`url(#f${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="5" strokeOpacity="0.35" filter={`url(#g${id})`} vectorEffect="non-scaling-stroke" />
        <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      </svg>
      {/* HTML dot: an SVG circle would be squashed by preserveAspectRatio="none". */}
      <span className="absolute size-2 -translate-1/2 rounded-full" style={{ left: `${last[0]}%`, top: `${last[1]}%`, background: color }}>
        <span className="absolute inset-0 animate-ping-slow rounded-full" style={{ background: color }} />
      </span>
    </div>
  );
}

function ChangePill({ usd, pct }: { usd: number; pct: number | null }) {
  const up = usd >= 0;
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 font-primary text-xs leading-none",
        up ? "bg-success/15 text-success" : "bg-danger/15 text-danger",
      )}
    >
      <Icon icon={up ? ArrowUpRight01Icon : ArrowDownRight01Icon} size={12} />
      {fmtUsd(Math.abs(usd))}
      {pct != null && <span className="opacity-70">{fmtPct(pct)}</span>}
    </span>
  );
}

export function PortfolioWidgetV2({ w }: { w: Widget }) {
  const wallet = str(w.settings.wallet);
  const period = str(w.settings.period) || "7d";
  const opacity = num(w.settings.bgOpacity, 100);
  const { data, isLoading } = useData<WalletData>("wallet", { address: wallet, period });
  if (!wallet) return <WEmpty size={w.size} label="Pick a verified wallet" />;
  if (isLoading || !data) return <WSkeleton size={w.size} />;

  const [whole, cents] = splitUsd(data.valueUsd);
  const change = data.changeUsd ?? 0;
  const color = change >= 0 ? "#2FE3AC" : "#FF4444";
  const values = data.history.map((h) => h.valueUsd);
  const label = PERIODS.find((p) => p.id === period)?.label.toUpperCase();
  const value = (
    <p className="font-primary text-[30px] leading-none">
      {whole}
      <span className="text-fg-3">{cents}</span>
    </p>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} className="items-stretch">
        <div className="relative z-10 flex flex-col justify-center gap-1.5">
          <WMuted className="font-primary text-xs uppercase">Portfolio · {label}</WMuted>
          {value}
          <ChangePill usd={change} pct={data.changePct} />
        </div>
        <AreaChart
          values={values}
          color={color}
          className="absolute inset-y-3 right-4 left-[42%] [mask-image:linear-gradient(90deg,transparent,black_30%)]"
        />
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity}>
      <div className="relative z-10 flex items-center justify-between">
        <WMuted className="font-primary text-xs uppercase">Portfolio</WMuted>
        <span className="rounded-full bg-white/10 px-2 py-0.5 font-primary text-[10px] leading-none text-fg-2">{label}</span>
      </div>
      <div className="relative z-10 mt-2 flex flex-col gap-1.5">
        {value}
        <ChangePill usd={change} pct={data.changePct} />
      </div>
      <AreaChart values={values} color={color} className="absolute inset-x-0 bottom-3 h-[46%]" />
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------------ music */

function Equalizer({ bars = 5, className }: { bars?: number; className?: string }) {
  return (
    <span className={cn("flex h-4 items-end gap-[3px]", className)} aria-hidden>
      {Array.from({ length: bars }, (_, i) => (
        <span
          key={i}
          className="h-full w-[3px] origin-bottom animate-eq rounded-full bg-[#1DB954]"
          style={{ animationDelay: `${(i * 0.17) % 0.9}s`, animationDuration: `${0.9 + (i % 3) * 0.2}s` }}
        />
      ))}
    </span>
  );
}

/** Blurred cover art behind the widget, like a now-playing screen. */
function Ambient({ src }: { src: string | null }) {
  if (!src) return null;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="absolute inset-0 size-full scale-150 object-cover opacity-70 blur-2xl" />
      <span className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/75" />
    </>
  );
}

function PlayButton({ className }: { className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg", className)}>
      <Icon icon={PlayIcon} size={16} className="translate-x-px fill-black" />
    </span>
  );
}

export function MusicWidgetV2({ w }: { w: Widget }) {
  const url = str(w.settings.url);
  const { data, isLoading, isError } = useData<MediaData>("media", { url });
  if (!url) return <WEmpty size={w.size} label="Add a Spotify link" />;
  if (isError) return <WEmpty size={w.size} label="Track not found" />;
  if (isLoading || !data) return <WSkeleton size={w.size} />;

  const cover = (cls: string) => (
    <div className={cn("relative shrink-0 overflow-hidden rounded-xl bg-white/10 shadow-[0_8px_24px_rgba(0,0,0,0.5)]", cls)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {data.thumbnailUrl && <img src={data.thumbnailUrl} alt="" className="size-full object-cover" />}
    </div>
  );
  const logo = <Icon icon={SpotifyIcon} size={20} className="shrink-0 text-[#1DB954]" />;

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" href={data.url} className="p-3">
        <Ambient src={data.thumbnailUrl} />
        <div className="relative z-10 flex size-full items-center gap-3">
          {cover("aspect-square h-full")}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <Equalizer bars={4} className="h-3" />
              <span className="font-primary text-[10px] leading-none text-[#1DB954] uppercase">Now playing</span>
            </div>
            <WTitle className="text-xl leading-none">{data.title}</WTitle>
            {data.author && <p className="truncate text-[11px] text-fg-2">{data.author}</p>}
          </div>
          <div className="flex flex-col items-end justify-between self-stretch">
            {logo}
            <PlayButton className="size-9" />
          </div>
        </div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" href={data.url}>
      <Ambient src={data.thumbnailUrl} />
      <div className="relative z-10 flex size-full flex-col">
        <div className="flex items-start justify-between">
          {cover("size-[84px]")}
          {logo}
        </div>
        <WTitle className="mt-auto text-xl leading-none">{data.title}</WTitle>
        {data.author && <p className="truncate text-[11px] text-fg-2">{data.author}</p>}
        <div className="mt-2.5 flex items-center justify-between">
          <Equalizer />
          <PlayButton className="size-9" />
        </div>
      </div>
    </WidgetFrame>
  );
}

/* ------------------------------------------------------------------ clock */

/** Sky colors by local hour: night, dawn, day, dusk. */
function sky(hour: number) {
  if (hour < 5 || hour >= 21) return { bg: "linear-gradient(160deg,#1b1f4b 0%,#0b0d22 70%)", icon: Moon02Icon, tint: "#C9D2FF" };
  if (hour < 8) return { bg: "linear-gradient(160deg,#ff9a8b 0%,#7b5ea7 55%,#2a2350 100%)", icon: Sun03Icon, tint: "#FFE1A8" };
  if (hour < 17) return { bg: "linear-gradient(160deg,#3a8dde 0%,#1f4f9a 60%,#142a5c 100%)", icon: Sun03Icon, tint: "#FFE27A" };
  return { bg: "linear-gradient(160deg,#ff7e5f 0%,#a2456e 50%,#2b1e4d 100%)", icon: Sun03Icon, tint: "#FFC27A" };
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function ClockWidgetV2({ w }: { w: Widget }) {
  const tz = str(w.settings.timezone) || "UTC";
  const city = str(w.settings.city).replace(/,$/, "");
  const country = str(w.settings.country);
  const now = useNow(10_000);
  let time = "--:--";
  let hour = 12;
  let offset = "";
  try {
    if (now) {
      time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(now);
      hour = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(now));
      offset = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(now).find((p) => p.type === "timeZoneName")?.value ?? "";
    }
  } catch {
    time = "--:--";
  }
  const s = sky(hour);
  const place = (
    <div className="flex min-w-0 items-center gap-1.5">
      {country && <Flag country={country} className="size-4 shrink-0 rounded-full" />}
      <span className="truncate font-primary text-base leading-none uppercase">{city || tz.split("/").pop()?.replace(/_/g, " ")}</span>
    </div>
  );
  const icon = <Icon icon={s.icon} size={22} style={{ color: s.tint, filter: `drop-shadow(0 0 10px ${s.tint})` }} />;

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" style={{ background: s.bg }}>
        <p className="font-primary text-[60px] leading-none tabular-nums">{time}</p>
        <div className="min-w-0 flex-1">
          {place}
          <WMuted className="mt-1 text-white/60">{offset}</WMuted>
        </div>
        {icon}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" style={{ background: s.bg }}>
      <div className="flex items-start justify-between">
        <WMuted className="text-white/60">{offset}</WMuted>
        {icon}
      </div>
      <p className="mt-auto font-primary text-[64px] leading-[0.85] tabular-nums">{time}</p>
      <div className="mt-2">{place}</div>
    </WidgetFrame>
  );
}

/* -------------------------------------------------------------- followers */

const platforms = {
  x: { icon: NewTwitterIcon, color: "#FFFFFF", url: (h: string) => `https://x.com/${h}`, name: "X" },
  youtube: { icon: YoutubeIcon, color: "#FF3B3B", url: (h: string) => `https://youtube.com/@${h}`, name: "YouTube" },
  twitch: { icon: TwitchIcon, color: "#A970FF", url: (h: string) => `https://twitch.tv/${h}`, name: "Twitch" },
  tiktok: { icon: TiktokIcon, color: "#25F4EE", url: (h: string) => `https://tiktok.com/@${h}`, name: "TikTok" },
  instagram: { icon: InstagramIcon, color: "#E1306C", url: (h: string) => `https://instagram.com/${h}`, name: "Instagram" },
} as const;

/** Counts up from 0 once on mount, so the number lands when the profile opens. */
function useCountUp(target: number, ms = 1200) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

export function FollowersWidgetV2({ w }: { w: Widget }) {
  const key = (str(w.settings.platform) || "x") as keyof typeof platforms;
  const p = platforms[key] ?? platforms.x;
  const handle = str(w.settings.handle).replace(/^@/, "");
  const count = useCountUp(num(w.settings.count, 0));
  const opacity = num(w.settings.bgOpacity, 100);
  if (!handle) return <WEmpty size={w.size} label="Add your handle" />;
  const glow = { background: `radial-gradient(120% 90% at 0% 0%, ${p.color}33 0%, transparent 60%), rgba(255,255,255,${(0.1 * opacity) / 100})` };
  const badge = (cls: string, size: number) => (
    <span className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-black/40", cls)} style={{ color: p.color, boxShadow: `0 0 24px ${p.color}55` }}>
      <Icon icon={p.icon} size={size} />
    </span>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" href={p.url(handle)} style={glow}>
        {badge("size-14", 28)}
        <div className="min-w-0 flex-1">
          <p className="font-primary text-[38px] leading-none tabular-nums">{fmtNumber(count)}</p>
          <WMuted className="mt-0.5">followers on {p.name} · @{handle}</WMuted>
        </div>
        <WPill className="shrink-0">Follow</WPill>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" href={p.url(handle)} style={glow}>
      {badge("size-12", 24)}
      <p className="mt-auto font-primary text-[40px] leading-none tabular-nums">{count >= 1_000_000 ? fmtCompact(count) : fmtNumber(count)}</p>
      <WMuted className="mt-0.5 truncate">followers · @{handle}</WMuted>
      <WPill className="mt-3 w-full">Follow</WPill>
    </WidgetFrame>
  );
}
