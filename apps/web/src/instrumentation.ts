/**
 * Server-side error reports (SSR, route handlers) go to Sentry when
 * SENTRY_DSN is set. Without it nothing is loaded.
 */
export async function register() {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.init({ dsn: process.env.SENTRY_DSN, environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV, tracesSampleRate: 0 });
}

export async function onRequestError(...args: Parameters<typeof import("@sentry/nextjs").captureRequestError>) {
  if (!process.env.SENTRY_DSN) return;
  const Sentry = await import("@sentry/nextjs");
  Sentry.captureRequestError(...args);
}
