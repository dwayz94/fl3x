"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { PencilEdit02Icon } from "@hugeicons/core-free-icons";
import type { FullPublicProfile } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { useIsOwner } from "@/lib/use-owner";
import { ProfileView } from "./ProfileView";
import { AnimatedBackdrop } from "./AnimatedBackdrop";
import { backdropStyle, cursorStyle, effectiveTheme } from "./theme";

function track(username: string, kind: "view" | "click", target?: string) {
  const body = JSON.stringify({ username, kind, target, referrer: document.referrer });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  else void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
}

export function PublicProfile({ profile }: { profile: FullPublicProfile }) {
  const owner = useIsOwner(profile.username);
  const theme = effectiveTheme(profile.theme, profile.tier);
  useEffect(() => {
    // One view per tab session, so refreshes don't inflate the count.
    const key = `fl3x:viewed:${profile.username}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track(profile.username, "view");
  }, [profile.username]);

  return (
    <main
      className="relative isolate flex min-h-svh flex-col items-center px-3 py-10 md:px-6 md:py-20"
      style={{ ...backdropStyle(theme), cursor: cursorStyle(theme) }}
    >
      {/* Premium animated background, behind everything, fixed to the viewport. */}
      <AnimatedBackdrop theme={theme} className="fixed inset-0 -z-10" />
      {/* Only the signed-in owner sees this. */}
      {owner && (
        <Link
          href="/dashboard/customize"
          className="fixed top-4 right-4 z-20 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-sm backdrop-blur-md transition-colors hover:bg-black/80"
        >
          <Icon icon={PencilEdit02Icon} size={16} className="text-brand" />
          Edit profile
        </Link>
      )}
      <ProfileView profile={profile} tier={profile.tier} views={profile.views} onLinkClick={(t) => track(profile.username, "click", t)} />
      {/* Premium can hide the FL3X mark. */}
      {!(profile.tier === "premium" && profile.theme.branding === false) && (
        <Link href="/" className="mt-auto pt-12 opacity-50 transition-opacity hover:opacity-100" aria-label="Made with FL3X">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={64} height={22} />
        </Link>
      )}
    </main>
  );
}
