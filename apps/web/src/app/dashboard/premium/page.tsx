"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { RefreshIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import type { Me, Tier } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { PageHeader, Panel, Spinner } from "@/components/dashboard/Panel";
import { premiumBackground } from "@/components/landing/HolderTiers";
import { Brand, Button, Icon } from "@/components/ui";
import { api } from "@/lib/api";
import { fmtCompact, fmtNumber } from "@/lib/format";
import { useConfig } from "@/lib/use-config";

const label: Record<Tier, string> = { none: "FR[e]e", starter: "ST[a]RTeR", premium: "PR[e]M[i]UM" };

export default function PremiumPage() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const { data: config } = useConfig();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  if (!me || !config) return <Spinner />;

  const { starter, premium } = config.thresholds;
  const symbol = config.token.symbol;
  const target = me.tier === "premium" ? premium : me.tier === "starter" ? premium : starter;
  const pct = Math.min(100, (me.tokenBalance / target) * 100);

  const refresh = async () => {
    setRefreshing(true);
    try {
      qc.setQueryData(["me"], await api<Me>("/me/refresh-tier", { method: "POST", token: await getToken() }));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-10">
      <PageHeader title="PR[e]M[i]UM" subtitle={`Your tier follows the $${symbol} you hold in your linked wallets.`} />
      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col gap-4 rounded-[30px] p-8" style={{ background: me.tier === "premium" ? premiumBackground : "#191919" }}>
          <div className="flex items-start justify-between">
            <h2 className="text-6xl leading-none">
              <Brand>{label[me.tier]}</Brand>
            </h2>
            <Button variant="ghost" size="sm" onClick={refresh} loading={refreshing} aria-label="Refresh balance">
              <Icon icon={RefreshIcon} size={18} />
            </Button>
          </div>
          <p className="font-primary text-4xl">
            {fmtNumber(me.tokenBalance)} <span className="text-fg-2">${symbol}</span>
          </p>
          {me.tier !== "premium" && (
            <>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-fg-2">
                {fmtNumber(Math.max(0, target - me.tokenBalance))} more ${symbol} to reach {me.tier === "none" ? "Starter" : "Premium"}.
              </p>
            </>
          )}
          {me.wallets.length === 0 && <p className="text-sm text-danger">Link a Solana wallet in Settings so we can see your balance.</p>}
          {config.token.mint && (
            <a
              href={`https://jup.ag/swap/SOL-${config.token.mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-auto inline-flex h-12 items-center justify-center rounded-2xl bg-brand text-bg"
            >
              Buy ${symbol}
            </a>
          )}
        </section>
        <div className="flex flex-col gap-4">
          {(
            [
              ["Free", 0, ["Up to 4 widgets", "6 links", "Your fl3x.lol/@username"]],
              ["Starter", starter, ["Up to 8 widgets", "12 links", "Holder badge", "Background colors"]],
              ["Premium", premium, ["Up to 60 widgets", "40 links", "Premium badge", "Custom fonts & cursors", "Image backgrounds"]],
            ] as const
          ).map(([name, min, perks]) => (
            <Panel key={name} label={min ? `Hold ${fmtCompact(min)} $${symbol}` : "No token needed"} title={name}>
              <ul className="flex flex-col gap-1.5 text-sm">
                {perks.map((p) => (
                  <li key={p} className="flex items-center gap-2">
                    <Icon icon={Tick01Icon} size={16} className="text-brand" />
                    {p}
                  </li>
                ))}
              </ul>
            </Panel>
          ))}
        </div>
      </div>
    </div>
  );
}
