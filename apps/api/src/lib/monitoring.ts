import * as Sentry from "@sentry/node";
import { env } from "../env";

/** Error reports go to Sentry when SENTRY_DSN is set; otherwise only to the logs. */
export const sentryEnabled = Boolean(env.SENTRY_DSN);

if (sentryEnabled) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    // Errors only, no performance tracing. Request headers and bodies (tokens, signatures) aren't sent by default.
    tracesSampleRate: 0,
  });
}

export function captureError(err: unknown, context?: Record<string, unknown>) {
  if (sentryEnabled) Sentry.captureException(err, context ? { extra: context } : undefined);
}
