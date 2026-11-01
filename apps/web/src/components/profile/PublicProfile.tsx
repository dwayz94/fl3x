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
    // Blocked storage (privacy modes, some in-app browsers) throws: count the view and move on.
    const key = `fl3x:viewed:${profile.username}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track(profile.username, "view");
  }, [profile.username]);

  return (
    <main
      className="relative isolate flex min-h-svh flex-col items-center px-3 py-8 md:px-6 md:py-10"
      style={{ ...backdropStyle(theme), cursor: cursorStyle(theme) }}
    >
      {/* Premium animated background, behind everything, fixed to the viewport. */}
      <AnimatedBackdrop theme={theme} className="fixed inset-0 -z-10" />
      {/* A profile the team built for someone: says so, and lets them take it. */}
      {profile.claimable && (
        <Link
          href="/join"
          className="fixed bottom-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-black/60 px-4 py-2 text-sm whitespace-nowrap backdrop-blur-md transition-colors hover:bg-black/80"
        >
          Is this you? <span className="text-brand">Claim @{profile.username}</span>
        </Link>
      )}
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
      {/* Centered in the screen when it fits; a taller card starts at the top and the page scrolls. */}
      <div className="flex w-full flex-1 flex-col items-center justify-center">
        <ProfileView profile={profile} tier={profile.tier} views={profile.views} onLinkClick={(t) => track(profile.username, "click", t)} />
      </div>
      {/* Premium can hide the FL3X mark. */}
      {!(profile.tier === "premium" && profile.theme.branding === false) && (
        <Link href="/" className="pt-8 opacity-50 transition-opacity hover:opacity-100" aria-label="Made with FL3X">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={64} height={22} />
        </Link>
      )}
    </main>
  );
}
