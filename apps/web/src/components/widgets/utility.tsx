"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Widget } from "@fl3x/shared";
import { api } from "@/lib/api";
import { useIsDemo } from "@/lib/use-data";
import { WEmpty, WidgetFrame, WPill, WTitle } from "./WidgetFrame";

const num = (v: unknown, d: number) => (typeof v === "number" ? v : d);
const str = (v: unknown) => (typeof v === "string" ? v : "");

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

/** A line set big in Moga, with an optional author. The type shrinks as the quote gets longer. */
export function QuoteWidget({ w }: { w: Widget }) {
  const quote = str(w.settings.quote).trim();
  const author = str(w.settings.author).trim();
  const opacity = num(w.settings.bgOpacity, 100);
  if (!quote) return <WEmpty size={w.size} label="Write your quote" />;
  const long = w.size === "long";
  const size = long ? (quote.length > 70 ? 15 : quote.length > 40 ? 18 : 22) : quote.length > 90 ? 18 : quote.length > 50 ? 22 : 28;
  return (
    <WidgetFrame size={w.size} opacity={opacity} className={long ? "flex-col items-start justify-center gap-1" : "justify-center gap-2"}>
      <p className={`font-primary leading-[1.05] uppercase ${long ? "line-clamp-2" : "line-clamp-6"}`} style={{ fontSize: size }}>
        <span className="text-brand">“</span>
        {quote}
        <span className="text-brand">”</span>
      </p>
      {author && <p className="text-[11px] text-fg-2">— {author}</p>}
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
