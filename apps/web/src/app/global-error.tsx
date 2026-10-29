"use client";

import { useEffect } from "react";

/** Last-resort error screen (the root layout itself failed). Reported to Sentry when enabled. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) void import("@sentry/nextjs").then((Sentry) => Sentry.captureException(error));
  }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, minHeight: "100vh", display: "grid", placeItems: "center", background: "#000", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
        <div style={{ textAlign: "center", padding: 24 }}>
          <p style={{ fontSize: 28, margin: 0 }}>Something broke</p>
          <p style={{ opacity: 0.6, margin: "8px 0 20px" }}>We&apos;ve been told. Try again in a moment.</p>
          <button type="button" onClick={reset} style={{ background: "#FF97CB", color: "#000", border: 0, borderRadius: 12, padding: "10px 18px", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
