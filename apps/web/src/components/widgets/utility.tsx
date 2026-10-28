"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Widget } from "@fl3x/shared";
import { Flag } from "@/components/ui";
import { api } from "@/lib/api";
import { useIsDemo } from "@/lib/use-data";
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
        <Flag country={country} className="ml-auto h-14 w-[30%]" />
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="items-center text-center">
      <p className="font-primary text-[64px] leading-[0.9]">{time}</p>
      {city && <WTitle className="mt-1 text-base uppercase">{city}</WTitle>}
      <WMuted className="uppercase">{date}</WMuted>
      <Flag country={country} className="mt-auto h-14 w-full" />
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
          <Flag country={country} className="h-12 w-[84px]" />
          {cta}
        </div>
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} className="items-center text-center">
      <p className="font-primary text-[40px] leading-none">{left}</p>
      <WMuted className="uppercase">Ends {when.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}</WMuted>
      {title ? (
        <p className="my-auto line-clamp-2 font-primary text-2xl leading-none uppercase">{title}</p>
      ) : (
        <Flag country={country} className="my-auto h-12 w-full" />
      )}
      <div className="w-full">{cta}</div>
    </WidgetFrame>
  );
}

export function ImageWidget({ w }: { w: Widget }) {
  const url = str(w.settings.url);
  const caption = str(w.settings.caption);
  if (!url) return <WEmpty size={w.size} label="Add an image link" />;
  return (
    <WidgetFrame size={w.size} className="p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={caption} className="size-full rounded-2xl object-cover" />
      {caption && (
        <p className="absolute inset-x-5 bottom-5 rounded-xl bg-black/60 px-2 py-1 text-[10px] backdrop-blur">{caption}</p>
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
  const demo = useIsDemo();
  const key = ["reactions", w.id];
  const { data: counts = {} } = useQuery({
    queryKey: key,
    queryFn: () => api<Record<string, number>>(`/widgets/${w.id}/reactions`),
    // Showcase pages start from a seeded pile and react locally.
    initialData: demo ? Object.fromEntries(emojis.map((e, i) => [e, [12, 3, 30, 7, 2, 18][i % 6]])) : undefined,
    enabled: interactive && !demo,
  });
  const react = useMutation({
    mutationFn: async (emoji: string) =>
      demo ? { emoji, count: (counts[emoji] ?? 0) + 1 } : api<{ emoji: string; count: number }>(`/widgets/${w.id}/reactions`, { json: { emoji } }),
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

/** Image + title + text + an optional button to the owner's own thing (drop, shop, newsletter…). */
export function LinkWidget({ w }: { w: Widget }) {
  const image = str(w.settings.image);
  const title = str(w.settings.title);
  const body = str(w.settings.body);
  const ctaLabel = str(w.settings.ctaLabel);
  const url = str(w.settings.url);
  const opacity = num(w.settings.bgOpacity, 100);
  if (!title) return <WEmpty size={w.size} label="Give it a title" />;

  const cover = image && (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={image} alt="" className={w.size === "long" ? "h-full w-auto max-w-[96px] shrink-0 rounded-xl object-cover" : "size-[72px] shrink-0 rounded-xl object-cover"} />
  );
  const cta = ctaLabel && url && <WPill className={w.size === "long" ? "shrink-0" : "w-full"}>{ctaLabel}</WPill>;

  if (w.size === "long") {
    return (
      <WidgetFrame size="long" opacity={opacity} href={url || undefined}>
        {cover}
        <div className="min-w-0 flex-1">
          <WTitle className="line-clamp-1 whitespace-normal">{title}</WTitle>
          {body && <p className="line-clamp-3 text-[10px] leading-snug text-fg-2">{body}</p>}
        </div>
        {cta}
      </WidgetFrame>
    );
  }
  return (
    <WidgetFrame size="large" opacity={opacity} href={url || undefined} className="gap-2">
      <div className="flex items-start gap-2.5">
        {cover}
        <WTitle className="line-clamp-3 whitespace-normal text-xl leading-[1.05]">{title}</WTitle>
      </div>
      {body && <p className={`text-[10px] leading-snug text-fg-2 ${cta ? "line-clamp-4" : "line-clamp-[9]"}`}>{body}</p>}
      {cta && <div className="mt-auto">{cta}</div>}
    </WidgetFrame>
  );
}
