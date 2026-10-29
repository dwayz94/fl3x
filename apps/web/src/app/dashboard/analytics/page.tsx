"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Cursor01Icon, Link01Icon } from "@hugeicons/core-free-icons";
import { LINK_KINDS, TRAFFIC_SOURCES, type AnalyticsSummary, type LinkKind } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { LineChart } from "@/components/dashboard/LineChart";
import { Chip, PageHeader, Panel, Spinner } from "@/components/dashboard/Panel";
import { Segmented } from "@/components/editor/Field";
import { linkIcons } from "@/components/profile/links";
import { Flag, Icon } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtNumber } from "@/lib/format";

const RANGES = [
  { id: "7", label: "7d" },
  { id: "30", label: "30d" },
  { id: "90", label: "90d" },
];
const BAR_COLORS = ["#FFB547", "#4FC3F7", "#8B5CF6", "#2FE3AC", "#FF97CB", "#FF4D4D"];
const regionName = new Intl.DisplayNames(["en"], { type: "region" });

function share(n: number, total: number) {
  return total ? Math.round((n / total) * 100) : 0;
}

function Bars({ items }: { items: { label: string; count: number }[] }) {
  const total = items.reduce((a, b) => a + b.count, 0);
  if (!items.length) return <p className="py-10 text-center text-sm text-fg-3">No data yet</p>;
  return (
    <div className="grid flex-1 gap-3" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div key={it.label} className="flex min-h-24 flex-col border-r border-dashed border-white/10 pr-3 last:border-0">
          <p className="truncate text-xs text-fg-2 capitalize">{it.label}</p>
          <p className="font-primary text-xl">{share(it.count, total)}%</p>
          <p className="mt-auto text-[11px] text-fg-3">{fmtNumber(it.count)}</p>
          <span className="mt-2 h-1.5 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
        </div>
      ))}
    </div>
  );
}

/** A clicked target is a link kind ("x", "discord"…) or a custom link label. */
function linkLabel(target: string) {
  const kind = LINK_KINDS.find((k) => k.id === target);
  return { label: kind?.label ?? target, icon: kind ? linkIcons[kind.id as LinkKind] : Link01Icon };
}

const sourceIcon: Partial<Record<string, typeof Link01Icon>> = {
  x: linkIcons.x, telegram: linkIcons.telegram, discord: linkIcons.discord, youtube: linkIcons.youtube,
  tiktok: linkIcons.tiktok, instagram: linkIcons.instagram, twitch: linkIcons.twitch, google: linkIcons.website, other: linkIcons.website,
};

/** Ranked list with a proportional bar behind each row. */
function RankList({ items, empty }: { items: { key: string; label: string; icon: typeof Link01Icon; count: number }[]; empty: string }) {
  const total = items.reduce((a, b) => a + b.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length) return <p className="py-10 text-center text-sm text-fg-3">{empty}</p>;
  return (
    <ul className="-mr-2 flex min-h-0 flex-col gap-1.5 overflow-y-auto pr-2">
      {items.map((it, i) => (
        <li key={it.key} className="relative flex h-10 items-center gap-2.5 overflow-hidden rounded-xl bg-white/[0.03] px-3 text-sm">
          <span className="absolute inset-y-0 left-0 rounded-xl opacity-20" style={{ width: `${(it.count / max) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }} />
          <Icon icon={it.icon} size={16} className="relative text-fg-2" />
          <span className="relative min-w-0 flex-1 truncate">{it.label}</span>
          <span className="relative text-xs text-fg-3">{share(it.count, total)}%</span>
          <span className="relative w-12 text-right font-primary text-base">{fmtNumber(it.count)}</span>
        </li>
      ))}
    </ul>
  );
}

export default function AnalyticsPage() {
  const { getToken } = useAuth();
  const [days, setDays] = useState("30");
  const { data, isLoading } = useQuery({
    queryKey: ["analytics", days],
    queryFn: async () => api<AnalyticsSummary>(`/me/analytics?days=${days}`, { token: await getToken() }),
    refetchInterval: 30_000,
  });

  const clicksTotal = data ? data.clicks.reduce((a, b) => a + b.count, 0) : 0;
  return (
    // Fits one screen on desktop: views and geography on top, links, sources and devices below.
    <div className="flex flex-col px-4 py-8 md:px-8 lg:h-svh lg:py-6">
      <PageHeader
        title="ACC[o]UNT ANALYT[i]CS"
        subtitle="See exactly how far your profile reaches."
        action={<div className="w-48"><Segmented options={RANGES} value={days} onChange={setDays} /></div>}
      />
      {isLoading || !data ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-12 lg:grid-rows-[minmax(0,1.1fr)_minmax(0,1fr)] [&>section]:lg:min-h-0 [&>section]:lg:overflow-hidden">
          <Panel
            className="lg:col-span-8"
            label="Total views"
            title={fmtNumber(data.totalViews)}
            aside={
              <dl className="flex gap-6 text-right text-xs">
                <div><dt className="text-fg-3">Live now</dt><dd className="font-primary text-lg text-success">{fmtNumber(data.realtime)}</dd></div>
                <div><dt className="text-fg-3">Unique</dt><dd className="font-primary text-lg">{fmtNumber(data.uniqueVisitors)}</dd></div>
                <div><dt className="text-fg-3">Link clicks</dt><dd className="font-primary text-lg">{fmtNumber(clicksTotal)}</dd></div>
              </dl>
            }
          >
            <div className="flex min-h-0 flex-1 items-end [&_svg]:max-h-full">
              <LineChart
                points={data.daily.map((d) => ({
                  label: new Date(d.date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
                  value: d.views,
                }))}
              />
            </div>
          </Panel>

          <Panel
            className="lg:col-span-4"
            label="Geography"
            title={
              data.countries[0] ? (
                <>
                  {fmtNumber(data.countries[0].count)}
                  <Chip tone="muted">{regionName.of(data.countries[0].country)}</Chip>
                </>
              ) : (
                "No data yet"
              )
            }
          >
            <ul className="-mr-2 flex min-h-0 flex-col gap-2 overflow-y-auto pr-2">
              {data.countries.slice(0, 10).map((c) => (
                <li key={c.country} className="flex items-center gap-2 text-sm">
                  <Flag country={c.country} className="h-3.5 w-5 rounded-sm" />
                  <span className="flex-1 truncate text-fg-2">{regionName.of(c.country)}</span>
                  <span className="font-primary">{fmtNumber(c.count)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            className="lg:col-span-4"
            label="Most clicked links"
            title={
              <>
                {data.clicks[0] ? linkLabel(data.clicks[0].target).label : "No clicks yet"}
                {data.clicks[0] && <Chip>{share(data.clicks[0].count, clicksTotal)}%</Chip>}
              </>
            }
          >
            <RankList
              empty="Clicks on the links under your card show up here."
              items={data.clicks.slice(0, 6).map((c) => ({ key: c.target, ...linkLabel(c.target), count: c.count }))}
            />
          </Panel>

          <Panel
            className="lg:col-span-4"
            label="Where visitors come from"
            title={
              data.sources[0] ? (
                <>
                  {TRAFFIC_SOURCES.find((t) => t.id === data.sources[0]!.source)?.label}
                  <Chip>{share(data.sources[0].count, data.totalViews)}%</Chip>
                </>
              ) : (
                "No data yet"
              )
            }
          >
            <RankList
              empty="Share your profile: we'll show which site brought each visitor."
              items={data.sources.map((src) => ({
                key: src.source,
                label: TRAFFIC_SOURCES.find((t) => t.id === src.source)?.label ?? src.source,
                icon: sourceIcon[src.source] ?? Cursor01Icon,
                count: src.count,
              }))}
            />
          </Panel>

          {(() => {
            // Tablets and anything unusual count as "other".
            const devices = (["desktop", "mobile", "other"] as const).map((d) => ({
              label: d,
              count: data.devices.filter((x) => (d === "other" ? x.device !== "desktop" && x.device !== "mobile" : x.device === d)).reduce((a, b) => a + b.count, 0),
            }));
            const total = devices.reduce((a, b) => a + b.count, 0);
            const top = [...devices].sort((a, b) => b.count - a.count)[0]!;
            return (
              <Panel className="lg:col-span-4" label="Visitor devices" title={total ? <>{top.label}<Chip>{share(top.count, total)}%</Chip></> : "No data yet"}>
                <Bars items={devices} />
              </Panel>
            );
          })()}
        </div>
      )}
    </div>
  );
}
