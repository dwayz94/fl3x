"use client";

import { notFound, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSquare01Icon, Logout03Icon, UserAdd01Icon } from "@hugeicons/core-free-icons";
import { devSession } from "@/lib/dev-session";
import { AuthHeader } from "@/components/shared";
import { FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";

const sessions = [
  {
    kind: "member",
    icon: DashboardSquare01Icon,
    title: "Test member",
    text: "@tester, Premium, profile filled with widgets, links and two weeks of analytics.",
    next: "/dashboard",
  },
  {
    kind: "fresh",
    icon: UserAdd01Icon,
    title: "New account",
    text: "A brand new signed-in account with no username: goes through join, invite and waitlist.",
    next: "/join",
  },
] as const;

/**
 * Local test sessions, so the dashboard can be checked without Privy keys.
 * Only exists in local dev: the API route behind it is off in production.
 */
export function DevSessions() {
  const params = useSearchParams();
  const [current, setCurrent] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setCurrent(devSession.enabled ? devSession.current() : null), []);
  if (!devSession.enabled) notFound();

  const start = async (kind: (typeof sessions)[number]["kind"], next: string) => {
    setError(null);
    setBusy(kind);
    try {
      const { token } = await api<{ token: string }>("/dev/session", { json: { kind } });
      devSession.set(token.slice(4));
      // Full reload so the auth provider picks the new session up.
      window.location.href = kind === "fresh" ? next : (params.get("next") ?? next);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Is the API running on :4000?");
      setBusy(null);
    }
  };

  return (
    <>
      <AuthHeader title="Test session" subtitle="Local only. Pick who you want to be, no Privy keys needed." />
      <div className="flex w-full flex-col gap-3">
        {sessions.map((s) => (
          <button
            key={s.kind}
            type="button"
            disabled={busy !== null}
            onClick={() => start(s.kind, s.next)}
            className="flex items-center gap-4 rounded-[20px] bg-[#121212] p-4 text-left transition-colors hover:bg-[#1b1b1b] disabled:opacity-60"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-brand text-bg">
              {busy === s.kind ? <span className="size-4 animate-spin rounded-full border-2 border-bg border-t-transparent" /> : <Icon icon={s.icon} size={22} />}
            </span>
            <span className="min-w-0">
              <span className="block font-primary text-xl leading-none">{s.title}</span>
              <span className="mt-1 block text-xs text-fg-2">{s.text}</span>
            </span>
          </button>
        ))}
      </div>
      {error && <div className="mt-4 w-full"><FieldError>{error}</FieldError></div>}
      {current && (
        <button
          type="button"
          onClick={() => {
            devSession.clear();
            window.location.reload();
          }}
          className="mt-6 flex items-center gap-1.5 text-sm text-fg-2 hover:text-fg"
        >
          <Icon icon={Logout03Icon} size={16} />
          Sign out of @{current}
        </button>
      )}
    </>
  );
}
