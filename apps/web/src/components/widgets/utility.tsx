"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Widget } from "@fl3x/shared";
import { Flag } from "@/components/ui";
import { api } from "@/lib/api";
import { WEmpty, WidgetFrame, WMuted, WPill, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");

function useNow(intervalMs: number) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

export function ClockWidget({ w }: { w: Widget }) {
  const tz = str(w.settings.timezone) || "UTC";
  const city = str(w.settings.city);
  const country = str(w.settings.country);
  const opacity = num(w.settings.bgOpacity, 100);
  const now = useNow(10_000);
  let time = "--:--";
  let date = "";
  try {
    if (now) {
      time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit" }).format(now);
      date = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric" }).format(now);
    }
  } catch {
    time = "--:--";
  }

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity}>
        <p className="font-primary text-[56px] leading-none">{time}</p>
        <div className="min-w-0">
          {city && <WTitle className="text-sm uppercase">{city}</WTitle>}
          <WMuted>{date}</WMuted>
        </div>
        <Flag country={country} className="ml-auto h-12 w-[72px]" />
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity}>
      <p className="font-primary text-[56px] leading-none">{time}</p>
      {city && <WTitle className="mt-1 text-sm uppercase">{city}</WTitle>}
      <WMuted>{date}</WMuted>
      <Flag country={country} className="mt-auto h-10 w-[60px]" />
    </WidgetFrame>
  );
}

function remaining(target: Date, now: Date) {
  const ms = Math.max(0, target.getTime() - now.getTime());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return d > 0 ? `${d}D:${String(h).padStart(2, "0")}H` : `${h}H:${String(m).padStart(2, "0")}M`;
}

export function CountdownWidget({ w }: { w: Widget }) {
  const target = str(w.settings.target);
  const title = str(w.settings.title);
  const country = str(w.settings.country);
  const ctaLabel = str(w.settings.ctaLabel);
  const ctaUrl = str(w.settings.ctaUrl);
  const opacity = num(w.settings.bgOpacity, 100);
  const now = useNow(30_000);
  if (!target) return <WEmpty size={w.size} label="Pick a date" />;
  const when = new Date(target);
  const left = now ? remaining(when, now) : "--";
  const sub = (
    <WMuted className="uppercase">
      {title ? `${title} · ` : "Ends "}
      {when.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
    </WMuted>
  );
  const cta = ctaLabel && (
    <a href={ctaUrl || undefined} target="_blank" rel="noopener noreferrer">
      <WPill className="w-full">{ctaLabel}</WPill>
    </a>
  );

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity}>
        <div className="min-w-0 flex-1">
          <p className="font-primary text-[48px] leading-none">{left}</p>
          {sub}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Flag country={country} className="h-10 w-[60px]" />
          {cta}
        </div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity}>
      <p className="font-primary text-[40px] leading-none">{left}</p>
      {sub}
      <Flag country={country} className="mt-3 h-10 w-[60px]" />
      <div className="mt-auto">{cta}</div>
    </WidgetFrame>
  );
}

export function ImageWidget({ w }: { w: Widget }) {
  const url = str(w.settings.url);
  const caption = str(w.settings.caption);
  if (!url) return <WEmpty size={w.size} label="Add an image link" />;
  return (
    <WidgetFrame size={w.size} className="p-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={caption} className="absolute inset-0 size-full object-cover" />
      {caption && (
        <p className="absolute inset-x-2 bottom-2 rounded-xl bg-black/60 px-2 py-1 text-[10px] backdrop-blur">{caption}</p>
      )}
    </WidgetFrame>
  );
}

export function TextWidget({ w }: { w: Widget }) {
  const title = str(w.settings.title);
  const body = str(w.settings.body);
  const opacity = num(w.settings.bgOpacity, 100);
  if (!body) return <WEmpty size={w.size} label="Write something" />;
  return (
    <WidgetFrame size={w.size} opacity={opacity} className={w.size === "long" ? "flex-col items-start justify-center gap-1" : ""}>
      {title && <WTitle>{title}</WTitle>}
      <p className={`text-[11px] leading-snug text-fg-2 ${w.size === "long" ? "line-clamp-3" : "line-clamp-[10]"}`}>{body}</p>
    </WidgetFrame>
  );
}

const DEFAULT_EMOJIS = "🤑😈💀🤡🤖";

export function ReactionsWidget({ w, interactive }: { w: Widget; interactive: boolean }) {
  const emojis = [...new Intl.Segmenter().segment(str(w.settings.emojis) || DEFAULT_EMOJIS)].map((s) => s.segment).filter((s) => s.trim());
  const qc = useQueryClient();
  const key = ["reactions", w.id];
  const { data: counts = {} } = useQuery({
    queryKey: key,
    queryFn: () => api<Record<string, number>>(`/widgets/${w.id}/reactions`),
    enabled: interactive,
  });
  const react = useMutation({
    mutationFn: (emoji: string) => api<{ emoji: string; count: number }>(`/widgets/${w.id}/reactions`, { json: { emoji } }),
    onSuccess: (r) => qc.setQueryData<Record<string, number>>(key, (old) => ({ ...old, [r.emoji]: r.count })),
  });
  // Scatter emojis in proportion to their counts (decorative pile).
  const pile = emojis.flatMap((e) => Array.from({ length: Math.min(6, Math.max(1, Math.ceil(Math.log2((counts[e] ?? 0) + 1)))) }, () => e));

  return (
    <WidgetFrame size={w.size} className="flex-col items-stretch">
      <div className="relative flex-1 overflow-hidden">
        {pile.map((e, i) => (
          <span
            key={i}
            className="absolute text-2xl"
            style={{ left: `${(i * 37) % 85}%`, top: `${(i * 53) % 75}%`, transform: `rotate(${(i * 47) % 50 - 25}deg)` }}
          >
            {e}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1 rounded-lg bg-white/10 px-2 py-1">
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            disabled={!interactive || react.isPending}
            onClick={(ev) => {
              ev.stopPropagation();
              react.mutate(e);
            }}
            className="text-sm transition-transform hover:scale-125 disabled:cursor-default"
            title={`${counts[e] ?? 0}`}
          >
            {e}
          </button>
        ))}
      </div>
    </WidgetFrame>
  );
}
