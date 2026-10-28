"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AnalyticsSummary } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { LineChart } from "@/components/dashboard/LineChart";
import { Chip, PageHeader, Panel, Spinner } from "@/components/dashboard/Panel";
import { Segmented } from "@/components/editor/Field";
import { Flag } from "@/components/ui";
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
        <div key={it.label} className="flex min-h-40 flex-col border-r border-dashed border-white/10 pr-3 last:border-0">
          <p className="truncate text-xs text-fg-2 capitalize">{it.label}</p>
          <p className="font-primary text-xl">{share(it.count, total)}%</p>
          <p className="mt-auto text-[11px] text-fg-3">{fmtNumber(it.count)}</p>
          <span className="mt-2 h-1.5 rounded-full" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
        </div>
      ))}
    </div>
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-10">
      <PageHeader
        title="ACC[o]UNT ANALYT[i]CS"
        subtitle="See exactly how far your profile reaches."
        action={<div className="w-48"><Segmented options={RANGES} value={days} onChange={setDays} /></div>}
      />
      {isLoading || !data ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <Panel
            className="lg:col-span-5"
            label="Most clicked"
            title={
              <>
                {data.clicks[0]?.target ?? "No clicks yet"}
                {data.clicks[0] && <Chip>{share(data.clicks[0].count, data.clicks.reduce((a, b) => a + b.count, 0))}%</Chip>}
              </>
            }
          >
            <Bars items={data.clicks.slice(0, 5).map((c) => ({ label: c.target, count: c.count }))} />
          </Panel>

          <Panel className="lg:col-span-3" label="Real-time visitors" title={<>{fmtNumber(data.realtime)} <Chip tone="success">live</Chip></>}>
            <dl className="mt-auto grid gap-3 text-sm">
              <div className="flex justify-between"><dt className="text-fg-2">Views</dt><dd className="font-primary text-lg">{fmtNumber(data.totalViews)}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-2">Unique visitors</dt><dd className="font-primary text-lg">{fmtNumber(data.uniqueVisitors)}</dd></div>
              <div className="flex justify-between"><dt className="text-fg-2">Top referrer</dt><dd className="truncate">{data.referrers[0]?.referrer ?? "Direct"}</dd></div>
            </dl>
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
            <ul className="flex flex-col gap-2">
              {data.countries.slice(0, 6).map((c) => (
                <li key={c.country} className="flex items-center gap-2 text-sm">
                  <Flag country={c.country} className="h-3.5 w-5 rounded-sm" />
                  <span className="flex-1 truncate text-fg-2">{regionName.of(c.country)}</span>
                  <span className="font-primary">{fmtNumber(c.count)}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel
            className="lg:col-span-5"
            label="Visitor devices"
            title={
              (() => {
                const top = [...data.devices].sort((a, b) => b.count - a.count)[0];
                const total = data.devices.reduce((a, b) => a + b.count, 0);
                return top ? <>{top.device}<Chip>{share(top.count, total)}%</Chip></> : "No data yet";
              })()
            }
          >
            <Bars
              items={(["desktop", "tablet", "mobile"] as const).map((d) => ({ label: d, count: data.devices.find((x) => x.device === d)?.count ?? 0 }))}
            />
          </Panel>

          <Panel className="lg:col-span-7" label="Total views" title={fmtNumber(data.totalViews)}>
            <LineChart
              points={data.daily.map((d) => ({
                label: new Date(d.date).toLocaleDateString("en-US", { day: "numeric", month: "short" }),
                value: d.views,
              }))}
            />
          </Panel>
        </div>
      )}
    </div>
  );
}
