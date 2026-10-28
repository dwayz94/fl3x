import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../env";
import * as schema from "./schema";

const migrationsFolder = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../drizzle");

/**
 * Production: managed Postgres via DATABASE_URL (Render Postgres / Neon).
 * Local dev without DATABASE_URL: embedded PGlite in .pglite/ so the API
 * runs with zero setup. Same SQL dialect, same migrations.
 */
async function connect() {
  if (env.DATABASE_URL) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { migrate } = await import("drizzle-orm/node-postgres/migrator");
    const db = drizzle(env.DATABASE_URL, { schema });
    await migrate(db, { migrationsFolder });
    return db;
  }
  const { drizzle } = await import("drizzle-orm/pglite");
  const { migrate } = await import("drizzle-orm/pglite/migrator");
  const db = drizzle(".pglite", { schema });
  await migrate(db, { migrationsFolder });
  return db as unknown as Awaited<ReturnType<typeof import("drizzle-orm/node-postgres").drizzle<typeof schema>>>;
}

export const db = await connect();
export { schema };
