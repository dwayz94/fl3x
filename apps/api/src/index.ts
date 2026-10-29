import { buildApp } from "./app";
import { env } from "./env";
import { snapshotWallets } from "./lib/providers/wallet";
import { walletsToSnapshot } from "./lib/wallets";

const app = await buildApp();
await app.listen({ port: env.PORT, host: "0.0.0.0" });

// Hourly wallet snapshots feed the P&L / portfolio widgets.
const HOUR = 60 * 60 * 1000;
setInterval(async () => {
  try {
    await snapshotWallets(await walletsToSnapshot(), (m) => app.log.warn(m));
  } catch (err) {
    app.log.error(err);
  }
}, HOUR).unref();
