"use client";

import { useEffect } from "react";

/** A page failed (often the API restarting): offer a retry instead of a dead end. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
  }, [error]);
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="text-5xl">Be right back</h1>
      <p className="max-w-sm text-fg-2">This page couldn&apos;t load. We&apos;re probably restarting, give it a few seconds.</p>
      <button type="button" onClick={reset} className="mt-2 rounded-2xl bg-brand px-5 py-2.5 text-bg">
        Try again
      </button>
    </main>
  );
}
