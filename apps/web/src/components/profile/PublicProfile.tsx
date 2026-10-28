"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import type { FullPublicProfile } from "@fl3x/shared";
import { ProfileView } from "./ProfileView";
import { backdropStyle, cursorStyle } from "./theme";

function track(username: string, kind: "view" | "click", target?: string) {
  const body = JSON.stringify({ username, kind, target, referrer: document.referrer });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  else void fetch("/api/track", { method: "POST", body, keepalive: true, headers: { "content-type": "application/json" } });
}

export function PublicProfile({ profile }: { profile: FullPublicProfile }) {
  useEffect(() => {
    // One view per tab session, so refreshes don't inflate the count.
    const key = `fl3x:viewed:${profile.username}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    track(profile.username, "view");
  }, [profile.username]);

  return (
    <main className="flex min-h-svh flex-col items-center px-3 py-10 md:px-6 md:py-20" style={{ ...backdropStyle(profile.theme), cursor: cursorStyle(profile.theme) }}>
      <ProfileView profile={profile} tier={profile.tier} views={profile.views} onLinkClick={(t) => track(profile.username, "click", t)} />
      <Link href="/" className="mt-auto pt-12 opacity-50 transition-opacity hover:opacity-100" aria-label="Made with FL3X">
        <Image src="/images/fl3x-logo.svg" alt="FL3X" width={64} height={22} />
      </Link>
    </main>
  );
}
