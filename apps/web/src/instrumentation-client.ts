/**
 * Browser error reports, only when NEXT_PUBLIC_SENTRY_DSN is set. The SDK
 * (~180 KB) loads on the first error only: pages that never fail never
 * download it. That first error is reported, Sentry's own handlers catch the
 * next ones.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn && typeof window !== "undefined") {
  let loading = false;
  const first = (reason: unknown) => {
    if (loading) return;
    loading = true;
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onRejection);
    void import("@sentry/nextjs").then((Sentry) => {
      Sentry.init({ dsn, environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV, tracesSampleRate: 0 });
      Sentry.captureException(reason);
    });
  };
  const onError = (e: ErrorEvent) => first(e.error ?? e.message);
  const onRejection = (e: PromiseRejectionEvent) => first(e.reason);
  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onRejection);
}
