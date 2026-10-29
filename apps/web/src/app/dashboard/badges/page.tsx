"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckmarkCircle02Icon, LockIcon } from "@hugeicons/core-free-icons";
import { BADGES, type EditableProfile } from "@fl3x/shared";
import { BadgeIcon } from "@/components/profile/Badges";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader, Spinner } from "@/components/dashboard/Panel";
import { Icon } from "@/components/ui";
import { api } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

export default function BadgesPage() {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data } = useEditorProfile();
  const [busy, setBusy] = useState<string | null>(null);
  if (!data) return <Spinner />;
  const { profile, ownedBadges } = data;
  // Unlocked badges first, the rest keep the catalogue order.
  const sorted = [...BADGES].sort((a, b) => Number(ownedBadges.includes(b.id)) - Number(ownedBadges.includes(a.id)));

  const toggle = async (id: string) => {
    setBusy(id);
    const badges = profile.badges.includes(id) ? profile.badges.filter((b) => b !== id) : [...profile.badges, id];
    try {
      const next = await api<EditableProfile>("/me/profile", {
        method: "PUT",
        token: await getToken(),
        json: { displayName: profile.displayName, bio: profile.bio, avatarUrl: profile.avatarUrl, badges, theme: profile.theme },
      });
      qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile: { ...old.profile, badges: next.badges } } : old));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-10">
      <PageHeader title="B[a]DG[e]S" subtitle="Badges make your profile shine. Click an owned badge to show or hide it." />
      <p className="mb-3 text-xs text-fg-3">
        {ownedBadges.length}/{BADGES.length} unlocked
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((b) => {
          const owned = ownedBadges.includes(b.id);
          const shown = profile.badges.includes(b.id);
          return (
            <button
              key={b.id}
              type="button"
              disabled={!owned || busy === b.id}
              onClick={() => toggle(b.id)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border bg-[#0d0d0d] p-4 text-left transition-colors",
                owned ? "border-white/10 hover:border-white/25" : "cursor-not-allowed border-white/5 opacity-50",
              )}
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/5" style={{ boxShadow: owned ? `0 0 24px ${b.color}33` : undefined }}>
                <BadgeIcon id={b.id} size={24} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-primary text-xl leading-none" style={{ color: owned ? b.color : undefined }}>{b.name}</span>
                <span className="mt-1 block text-[11px] leading-tight text-fg-3">{b.description}</span>
              </span>
              {owned ? (
                <span className={cn("flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs", shown ? "bg-brand text-bg" : "bg-white/10 text-fg-2")}>
                  <Icon icon={CheckmarkCircle02Icon} size={14} />
                  {shown ? "Shown" : "Owned"}
                </span>
              ) : (
                <Icon icon={LockIcon} size={16} className="shrink-0 text-fg-3" />
              )}
            </button>
          );
        })}
      </div>
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[linear-gradient(90deg,#0d0d0d_40%,#2a1420)] p-6">
        <div>
          <p className="font-primary text-2xl leading-none">Custom badge</p>
          <p className="mt-1 text-xs text-fg-3">Your own icon next to your name. Coming soon for Premium holders.</p>
        </div>
        <span className="rounded-xl bg-white/10 px-4 py-2 text-sm text-fg-2">Soon</span>
      </div>
    </div>
  );
}
