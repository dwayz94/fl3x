"use client";

import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Cancel01Icon, RefreshIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { MAX_BACKGROUND_VIDEO_SECONDS, TIER_LIMITS, TIERS, type Me, type Tier } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { PageHeader, Spinner } from "@/components/dashboard/Panel";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { Brand, Icon, Verified } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtCompact, fmtNumber } from "@/lib/format";
import { useConfig } from "@/lib/use-config";

const NAME: Record<Tier, string> = { none: "Free", starter: "Starter", premium: "Premium" };
const TITLE: Record<Tier, string> = { none: "FR[e]e", starter: "ST[a]RTeR", premium: "PR[e]M[i]UM" };

/** One row of the comparison: a value per tier (true / false show a tick or a dash). */
type Row = { label: ReactNode; values: Record<Tier, ReactNode | boolean> };

const premiumOnly = (label: ReactNode): Row => ({ label, values: { none: false, starter: false, premium: true } });
const ROWS: Row[] = [
  { label: "Live widgets", values: { none: TIER_LIMITS.none.widgets, starter: TIER_LIMITS.starter.widgets, premium: TIER_LIMITS.premium.widgets } },
  { label: "Profile links", values: { none: TIER_LIMITS.none.links, starter: TIER_LIMITS.starter.links, premium: TIER_LIMITS.premium.links } },
  {
    label: "Analytics history",
    values: { none: `${TIER_LIMITS.none.analyticsDays} days`, starter: `${TIER_LIMITS.starter.analyticsDays} days`, premium: `${TIER_LIMITS.premium.analyticsDays} days` },
  },
  { label: "Invites (pre-launch)", values: { none: TIER_LIMITS.none.invites, starter: TIER_LIMITS.starter.invites, premium: TIER_LIMITS.premium.invites } },
  { label: "Colors, backgrounds, your own images", values: { none: true, starter: true, premium: true } },
  premiumOnly(
    <span className="inline-flex items-center gap-1.5">
      Checkmark next to your name <Verified size={14} />
    </span>,
  ),
  premiumOnly("Custom fonts and cursors"),
  premiumOnly(`Animated, video and GIF backgrounds (${MAX_BACKGROUND_VIDEO_SECONDS} s)`),
  premiumOnly("Hide the FL3X mark"),
  premiumOnly("Premium badge"),
];

/** Your tier, your $FL3X and how far the next tier is; then what each tier gets, side by side. */
export default function PlanPage() {
  const { getToken } = useAuth();
  const { data: me } = useMe();
  const { data: config } = useConfig();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [linking, setLinking] = useState(false);
  if (!me || !config) return <Spinner />;

  const { starter, premium } = config.thresholds;
  const symbol = `$${config.token.symbol}`;
  const live = Boolean(config.token.mint);
  const hasSolana = me.wallets.some((w) => !w.startsWith("0x")) || me.linkedWallets.some((w) => w.chain === "solana");
  const next: Tier | null = me.tier === "none" ? "starter" : me.tier === "starter" ? "premium" : null;
  const missing = next ? Math.max(0, (next === "starter" ? starter : premium) - me.tokenBalance) : 0;
  // Two equal halves (Free → Starter, Starter → Premium): both stay readable whatever the thresholds.
  const byBalance = me.tokenBalance >= premium ? 1 : me.tokenBalance >= starter ? 0.5 + (0.5 * (me.tokenBalance - starter)) / (premium - starter) : (0.5 * me.tokenBalance) / starter;
  // A tier given by the team counts too: the bar never sits below the tier you have.
  const fill = Math.max(byBalance, TIERS.indexOf(me.tier) * 0.5);

  const refresh = async () => {
    setRefreshing(true);
    try {
      qc.setQueryData(["me"], await api<Me>("/me/refresh-tier", { method: "POST", token: await getToken() }));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-8 md:px-8 lg:py-6">
      <PageHeader title="PL[a]N" subtitle={`Your tier follows the ${symbol} you hold in your Solana wallets. No subscription.`} />

      {/* Status */}
      <section className="rounded-3xl bg-[#0d0d0d] p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-fg-3">Your tier</p>
            <h2 className="mt-1 flex items-center gap-2 text-5xl leading-none md:text-6xl">
              <Brand>{TITLE[me.tier]}</Brand>
              {me.tier === "premium" && <Verified size={28} />}
            </h2>
          </div>
          <div className="text-right">
            <p className="text-xs text-fg-3">You hold</p>
            <p className="mt-1 flex items-center justify-end gap-2 font-primary text-3xl leading-none">
              {fmtNumber(me.tokenBalance)} <span className="text-fg-3">{symbol}</span>
              <button
                type="button"
                onClick={() => void refresh()}
                disabled={refreshing}
                aria-label="Check my balance again"
                className="rounded-lg p-1.5 text-fg-3 transition-colors hover:bg-white/10 hover:text-fg disabled:opacity-50"
              >
                <Icon icon={RefreshIcon} size={16} className={refreshing ? "animate-spin" : undefined} />
              </button>
            </p>
          </div>
        </div>

        {/* Free ── Starter ── Premium, filled up to your balance. */}
        <div className="mt-8 px-1">
          <div className="relative h-2 rounded-full bg-white/[0.06]">
            <div className="absolute inset-y-0 left-0 rounded-full bg-brand transition-[width] duration-700" style={{ width: `${Math.max(fill * 100, 1)}%` }} />
            {TIERS.map((t, i) => {
              const reached = TIERS.indexOf(me.tier) >= i;
              return (
                <span
                  key={t}
                  className={cn("absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2", reached ? "border-brand bg-brand" : "border-white/20 bg-[#0d0d0d]")}
                  style={{ left: `${i * 50}%` }}
                />
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-3 text-xs">
            {TIERS.map((t, i) => (
              <div key={t} className={cn(i === 1 && "text-center", i === 2 && "text-right")}>
                <p className={cn("font-primary text-base leading-none", me.tier === t ? "text-brand" : "text-fg-2")}>{NAME[t]}</p>
                <p className="mt-1 text-fg-3">{t === "none" ? "No token needed" : `${fmtCompact(t === "starter" ? starter : premium)} ${symbol}`}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
          <p className="text-sm text-fg-2">
            {!live ? (
              <>
                {symbol} isn&apos;t live yet: everyone is on Free until launch. Your tier will follow your balance from then on.
              </>
            ) : next ? (
              <>
                <span className="text-brand">{fmtNumber(missing)}</span> more {symbol} to reach {NAME[next]}. Checked every 5 minutes.
              </>
            ) : (
              "You have everything FL3X offers. Thanks for holding."
            )}
          </p>
          <div className="flex gap-2">
            {!hasSolana && (
              <button type="button" onClick={() => setLinking(true)} className="h-10 rounded-xl bg-white/[0.08] px-4 text-sm hover:bg-white/[0.14]">
                Link a Solana wallet
              </button>
            )}
            {live && next && (
              <a
                href={`https://jup.ag/swap/SOL-${config.token.mint}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm text-bg transition-[filter] hover:brightness-110"
              >
                Get {symbol}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* What each tier gets */}
      <section className="overflow-x-auto rounded-3xl bg-[#0d0d0d] p-2 md:p-3">
        <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-[40%] p-3 text-left align-bottom font-normal text-fg-3">What you get</th>
              {TIERS.map((t) => (
                <th key={t} className={cn("rounded-t-2xl p-3 align-bottom font-normal", me.tier === t && "bg-brand/[0.08]")}>
                  {me.tier === t && <span className="mb-1.5 inline-block rounded-full bg-brand px-2 py-0.5 text-[10px] text-bg">Your plan</span>}
                  <p className="font-primary text-xl leading-none">{NAME[t]}</p>
                  <p className="mt-1 text-[11px] text-fg-3">{t === "none" ? "Free" : `${fmtCompact(t === "starter" ? starter : premium)} ${symbol}`}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, r) => (
              <tr key={r}>
                <td className="border-t border-white/[0.06] p-3 text-fg-2">{row.label}</td>
                {TIERS.map((t) => {
                  const v = row.values[t];
                  return (
                    <td
                      key={t}
                      className={cn("border-t border-white/[0.06] p-3 text-center", me.tier === t && "bg-brand/[0.08]", r === ROWS.length - 1 && me.tier === t && "rounded-b-2xl")}
                    >
                      {v === true ? (
                        <Icon icon={Tick02Icon} size={18} className="mx-auto text-brand" />
                      ) : v === false ? (
                        <Icon icon={Cancel01Icon} size={14} className="mx-auto text-fg-3/50" />
                      ) : (
                        <span className="font-primary text-base">{v}</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ConnectWalletModal open={linking} onClose={() => setLinking(false)} />
    </div>
  );
}
