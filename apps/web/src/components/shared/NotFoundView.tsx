"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { normalizeUsername } from "@fl3x/shared";
import { Brand, buttonClass } from "@/components/ui";
import { useAvailability } from "@/lib/use-availability";
import { AuthHeader, AuthShell } from "./AuthShell";

/** "/@alice" or "/u/alice" → "alice": a missing profile, which someone could claim. */
function profileHandle(path: string) {
  const m = path.match(/^\/(?:@|u\/)([^/]+)\/?$/);
  return m ? normalizeUsername(decodeURIComponent(m[1]!)) : null;
}

/** 404 in the sign-in pages' style. On a missing profile (/@name) that's still free, it offers to claim it. */
export function NotFoundView() {
  const handle = profileHandle(usePathname() ?? "/");
  const availability = useAvailability(handle ?? "");
  const free = handle && availability && availability !== "checking" && availability.available;

  return (
    <AuthShell>
      {free ? (
        <>
          <AuthHeader title={<Brand>{`@${handle}`}</Brand>} subtitle={<>Nobody has claimed fl3x.lol/@{handle} yet. It could be yours.</>} />
          <Link href={`/join?username=${encodeURIComponent(handle)}`} className={buttonClass({ className: "w-full" })}>
            Claim @{handle}
          </Link>
          <Link href="/" className="mt-4 text-sm text-fg-3 hover:text-fg">
            Back home
          </Link>
        </>
      ) : (
        <>
          <AuthHeader title={<Brand>4[0]4</Brand>} subtitle="This page doesn't exist, or it moved." />
          <Link href="/" className={buttonClass({ className: "w-full" })}>
            Back home
          </Link>
        </>
      )}
    </AuthShell>
  );
}
