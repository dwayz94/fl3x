import { eq, lt } from "drizzle-orm";
import { db, schema } from "../db";

const inflight = new Map<string, Promise<unknown>>();

/**
 * Read-through cache in Postgres. Concurrent misses for the same key share
 * one upstream request. Stale values are served if the upstream fails.
 */
export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const [hit] = await db.select().from(schema.dataCache).where(eq(schema.dataCache.key, key)).limit(1);
  if (hit && hit.expiresAt > new Date()) return hit.value as T;

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const p = (async () => {
    try {
      const value = await load();
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
      await db
        .insert(schema.dataCache)
        .values({ key, value: value as object, expiresAt })
        .onConflictDoUpdate({ target: schema.dataCache.key, set: { value: value as object, expiresAt } });
      return value;
    } catch (err) {
      if (hit) return hit.value as T;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return res.json() as Promise<T>;
}

/** Drops expired entries (run by the hourly job, so the table doesn't grow forever). */
export async function purgeExpiredCache() {
  await db.delete(schema.dataCache).where(lt(schema.dataCache.expiresAt, new Date(Date.now() - 24 * 3_600_000)));
}
