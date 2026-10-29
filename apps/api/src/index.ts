import { ne } from "drizzle-orm";
import "./lib/monitoring"; // first, so Sentry sees everything that follows
import { buildApp } from "./app";
import { captureError } from "./lib/monitoring";
import { db, schema } from "./db";
import { env } from "./env";
import { purgeExpiredCache } from "./lib/cache";
import { snapshotWallets } from "./lib/providers/wallet";
import { refreshTier } from "./lib/users";
import { walletsToSnapshot } from "./lib/wallets";

const app = await buildApp();
await app.listen({ port: env.PORT, host: "0.0.0.0" });

/**
 * Hourly job: wallet snapshots (P&L / portfolio history), tier re-check of
 * paying members (tokens can leave a wallet), cache cleanup. First run a few
 * minutes after boot so frequent deploys don't skip it; never two at once.
 */
const HOUR = 60 * 60 * 1000;
let running = false;
async function hourly() {
  if (running) return;
  running = true;
  try {
    await snapshotWallets(await walletsToSnapshot(), (m) => app.log.warn(m));
    const paying = await db.select().from(schema.users).where(ne(schema.users.tier, "none"));
    for (const user of paying) await refreshTier(user, true);
    await purgeExpiredCache();
  } catch (err) {
    app.log.error(err);
    captureError(err, { job: "hourly" });
  } finally {
    running = false;
  }
}
setTimeout(hourly, 5 * 60 * 1000).unref();
setInterval(hourly, HOUR).unref();
