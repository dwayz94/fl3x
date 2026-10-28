import { buildApp } from "./app";
import { env } from "./env";
import { snapshotTrackedWallets } from "./lib/providers/wallet";

const app = await buildApp();
await app.listen({ port: env.PORT, host: "0.0.0.0" });

// Hourly wallet snapshots feed the P&L / portfolio widgets.
const HOUR = 60 * 60 * 1000;
setInterval(() => void snapshotTrackedWallets((m) => app.log.warn(m)), HOUR).unref();
