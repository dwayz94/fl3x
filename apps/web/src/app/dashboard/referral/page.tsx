"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Crown02Icon, NewTwitterIcon, UserGroupIcon } from "@hugeicons/core-free-icons";
import { REFERRAL_REWARDS, type ReferralSummary } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { CopyField } from "@/components/dashboard/CopyField";
import { PageHeader, Spinner } from "@/components/dashboard/Panel";
import { Icon, Verified } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNumber, referralLink } from "@/lib/format";
import { useEditorProfile } from "@/lib/use-profile";

const MEDALS = ["#FFD66B", "#D9DEE8", "#E9A77A"];

export default function ReferralPage() {
  const { getToken } = useAuth();
  const { data: editor } = useEditorProfile();
  const { data: me } = useMe();
  const [tab, setTab] = useState<"board" | "crew">("board");
  const { data, isLoading } = useQuery({
    queryKey: ["referrals"],
    queryFn: async () => api<ReferralSummary>("/me/referrals", { token: await getToken() }),
    refetchInterval: 60_000,
  });
  if (isLoading || !data) return <Spinner />;

  const link = referralLink(data.username);
  const profile = editor?.profile;
  const tweet = `I'm flexing on @fl3xdotlol. Live widgets, verified wallets, one link.\n\nClaim your profile before your handle is gone:\n${link}`;
  // Progress toward passing the next member above you.
  const progress = data.toNextRank ? data.referrals / (data.referrals + data.toNextRank) : 1;
  const nextReward = REFERRAL_REWARDS.find((r) => data.referrals < r.count);

  return (
    <div className="flex flex-col px-4 py-8 md:px-8 lg:h-svh lg:py-6">
      <PageHeader title="R[e]F[e]RRAL" subtitle="Bring your friends to FL3X. Every member who joins with your link counts." />
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4">
          {/* Rank card */}
          <section className="relative overflow-hidden rounded-3xl bg-[#0d0d0d] p-5 md:p-6">
            <div className="pointer-events-none absolute -top-24 -right-16 size-64 rounded-full bg-brand/15 blur-3xl" />
            <div className="relative flex items-center gap-4">
              <div className="size-14 shrink-0 overflow-hidden rounded-full bg-white/10 md:size-16">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {profile?.avatarUrl && <img src={profile.avatarUrl} alt="" className="size-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate font-primary text-2xl leading-none uppercase md:text-3xl">
                  {profile?.displayName || data.username}
                  {me?.tier === "premium" && <Verified size={20} />}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs text-fg-3">
                  <Icon icon={UserGroupIcon} size={14} />
                  {data.referrals} referral{data.referrals === 1 ? "" : "s"}
                </p>
              </div>
              <p className="shrink-0 font-primary leading-none">
                <span className="text-4xl md:text-5xl">#{fmtNumber(data.rank)}</span>
                <span className="text-lg text-fg-3">/{fmtNumber(data.members)}</span>
              </p>
            </div>
            <div className="relative mt-5 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                <div className="h-full rounded-full bg-brand transition-[width] duration-700" style={{ width: `${Math.max(4, progress * 100)}%` }} />
              </div>
              <p className="shrink-0 text-xs text-fg-2">
                {data.toNextRank ? (
                  <>
                    <span className="text-brand">{data.toNextRank}</span> more to reach #{data.nextRank}
                  </>
                ) : data.referrals ? (
                  "You lead the board"
                ) : (
                  "Invite someone to get on the board"
                )}
              </p>
            </div>
            <div className="relative mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-4">
              <p className="text-xs text-fg-2">
                {nextReward ? (
                  <>
                    <span className="text-brand">{nextReward.count - data.referrals}</span> more for the {nextReward.badge.name} badge.
                  </>
                ) : (
                  "Every referral badge unlocked."
                )}
              </p>
              <ShareOnX text={tweet} label="Share my referral" />
            </div>
          </section>

          {/* Link card */}
          <section className="rounded-3xl bg-[#0d0d0d] p-5 md:p-6">
            <p className="text-xs text-fg-3">Share it everywhere</p>
            <h2 className="mt-0.5 font-primary text-2xl leading-none">Your referral link</h2>
            <div className="mt-5 border-t border-white/10 pt-5">
              <p className="mb-1.5 text-xs text-fg-2">Referral link</p>
              <CopyField value={link} display={link.replace(/^https?:\/\//, "")} />
              {data.code && (
                <p className="mt-2 text-[11px] text-fg-3">
                  Your code <span className="font-mono text-fg-2">{data.code}</span> still works too. {data.invitesLeft} invite{data.invitesLeft === 1 ? "" : "s"} left during pre-launch.
                </p>
              )}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-fg-3">Your handle is the link. No code to remember.</p>
              <ShareOnX text={tweet} label="Share it on" icon />
            </div>
          </section>

          {/* Rewards: a badge at each referral milestone. */}
          <section className="flex flex-col rounded-3xl bg-[#0d0d0d] p-5 lg:min-h-0 lg:flex-1">
            <h2 className="font-primary text-2xl leading-none">Rewards</h2>
            <p className="mt-1 mb-4 text-xs text-fg-3">A badge on your profile at each milestone. Every member who joins with your link counts.</p>
            <ul className="grid gap-2 sm:grid-cols-2">
              {REFERRAL_REWARDS.map(({ badge, count }) => {
                const done = data.referrals >= count;
                const pct = Math.min(1, data.referrals / count);
                return (
                  <li
                    key={badge.id}
                    className="relative flex items-center gap-3 overflow-hidden rounded-2xl p-3"
                    // Each reward wears its badge's color: full once unlocked, a faint tint before.
                    style={{ background: `color-mix(in srgb, ${badge.color} ${done ? 14 : 5}%, transparent)` }}
                  >
                    <span
                      className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl", !done && "opacity-60")}
                      style={{ background: `color-mix(in srgb, ${badge.color} 18%, transparent)` }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/images/badges/${badge.id}.svg`} alt="" className="size-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-primary text-lg leading-none" style={{ color: done ? badge.color : undefined }}>
                        {badge.name}
                      </p>
                      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full" style={{ width: `${Math.max(pct * 100, 2)}%`, background: badge.color }} />
                      </div>
                    </div>
                    <span className="shrink-0 text-right text-[11px] leading-tight">
                      {done ? (
                        <span style={{ color: badge.color }}>Unlocked</span>
                      ) : (
                        <>
                          <span className="text-fg-2">
                            {data.referrals}/{count}
                          </span>
                          <br />
                          <span className="text-fg-3">referrals</span>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>

        {/* Leaderboard */}
        <aside className="flex flex-col rounded-3xl bg-[#0d0d0d] p-5 lg:min-h-0">
          <div className="mb-4 flex items-center gap-1 border-b border-white/10 pb-4">
            {(["board", "crew"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn("rounded-xl px-3 py-1.5 font-primary text-xl leading-none transition-colors", tab === t ? "bg-white/10 text-fg" : "text-fg-3 hover:text-fg")}
              >
                {t === "board" ? "Leaderboard" : `Your crew · ${data.invited.length}`}
              </button>
            ))}
            <Icon icon={Crown02Icon} size={24} className="ml-auto text-brand" />
          </div>
          <div className="-mr-2 min-h-0 flex-1 overflow-y-auto pr-2">
          {tab === "crew" ? (
            data.invited.length ? (
              <ul className="flex flex-col gap-1">
                {data.invited.map((i) => (
                  <li key={i.username}>
                    <a href={`/@${i.username}`} target="_blank" className="flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-white/[0.04]">
                      <Avatar url={i.avatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-primary text-base leading-none">{i.displayName || i.username}</span>
                        <span className="block truncate text-[11px] text-fg-3">@{i.username}</span>
                      </span>
                      {i.joinedAt && <span className="text-[11px] text-fg-3">{new Date(i.joinedAt).toLocaleDateString("en-US", { day: "numeric", month: "short" })}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-10 text-center text-sm text-fg-3">Nobody yet. Your first referral shows up here.</p>
            )
          ) : data.leaderboard.length ? (
            <ol className="flex flex-col gap-1">
              {data.leaderboard.map((l) => (
                <li
                  key={l.username}
                  className={cn("flex items-center gap-3 rounded-xl px-2.5 py-2", l.you ? "bg-brand/10 ring-1 ring-brand/40" : "hover:bg-white/[0.03]")}
                >
                  <span className="w-6 text-center font-primary text-lg leading-none" style={{ color: MEDALS[l.rank - 1] ?? "rgb(255 255 255 / 0.35)" }}>
                    {l.rank}
                  </span>
                  <Avatar url={l.avatarUrl} ring={MEDALS[l.rank - 1]} />
                  <a href={`/@${l.username}`} target="_blank" className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 truncate font-primary text-base leading-none">
                      {l.displayName || l.username}
                      {l.premium && <Verified size={13} />}
                      {l.you && <span className="ml-1 rounded bg-brand px-1 font-secondary text-[9px] text-bg">YOU</span>}
                    </span>
                    <span className="block truncate text-[11px] text-fg-3">@{l.username}</span>
                  </a>
                  <span className="font-primary text-lg leading-none">{fmtNumber(l.referrals)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="py-10 text-center text-sm text-fg-3">No referrals yet. Be the first on the board.</p>
          )}
          </div>
          {tab === "board" && data.referrals > 0 && !data.leaderboard.some((l) => l.you) && (
            <div className="mt-2 flex items-center gap-3 rounded-xl bg-brand/10 px-2.5 py-2 ring-1 ring-brand/40">
              <span className="w-6 text-center font-primary text-lg leading-none text-fg-2">{data.rank}</span>
              <span className="flex-1 font-primary text-base">You</span>
              <span className="font-primary text-lg">{data.referrals}</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Avatar({ url, ring }: { url: string | null; ring?: string }) {
  return (
    <span className="size-9 shrink-0 overflow-hidden rounded-full bg-white/10" style={ring ? { boxShadow: `0 0 0 2px ${ring}` } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {url && <img src={url} alt="" className="size-full object-cover" />}
    </span>
  );
}

function ShareOnX({ text, label, icon }: { text: string; label: string; icon?: boolean }) {
  return (
    <a
      href={`https://x.com/intent/post?text=${encodeURIComponent(text)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="flex h-9 items-center gap-1.5 rounded-xl bg-brand px-4 text-sm text-bg transition-transform hover:scale-[1.03]"
    >
      {label}
      {icon && <Icon icon={NewTwitterIcon} size={15} />}
    </a>
  );
}
