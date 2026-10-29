/**
 * Browser error reports, only when NEXT_PUBLIC_SENTRY_DSN is set. The SDK is
 * imported lazily so pages don't carry it when monitoring is off.
 */
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  void import("@sentry/nextjs").then((Sentry) =>
    Sentry.init({ dsn, environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV, tracesSampleRate: 0 }),
  );
}
