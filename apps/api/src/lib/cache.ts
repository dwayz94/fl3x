import { eq, lt } from "drizzle-orm";
import { db, schema } from "../db";

const inflight = new Map<string, Promise<unknown>>();
/** Keys whose upstream just failed: no new upstream call until this time (ms). */
const coolingDown = new Map<string, number>();
const COOLDOWN_MS = 60_000;
/** "Nothing found" is cached too (the column is NOT NULL, so as a marker), for at most 10 min. */
const NONE = { __none: true } as const;
const NONE_TTL_SECONDS = 600;
const isNone = (v: unknown) => typeof v === "object" && v !== null && "__none" in v;

/**
 * Read-through cache in Postgres, to spend as few third-party calls as possible:
 * - concurrent misses for the same key share one upstream request;
 * - "not found" answers are cached, so unknown handles/tokens can't be used to spam a provider;
 * - after an upstream failure (rate limit, outage) the key rests for a minute, serving the
 *   stale value if there is one.
 */
export async function cached<T>(key: string, ttlSeconds: number, load: () => Promise<T>): Promise<T> {
  const [hit] = await db.select().from(schema.dataCache).where(eq(schema.dataCache.key, key)).limit(1);
  const stale = hit ? ((isNone(hit.value) ? null : hit.value) as T) : undefined;
  if (hit && hit.expiresAt > new Date()) return stale as T;

  const resting = coolingDown.get(key);
  if (resting && resting > Date.now()) {
    if (stale !== undefined) return stale;
    throw new Error(`${key}: upstream cooling down`);
  }

  const pending = inflight.get(key);
  if (pending) {
    // Someone is already refreshing it: a recent value now beats waiting for the upstream.
    if (stale !== undefined && recent(hit!.expiresAt, ttlSeconds)) return stale;
    return pending as Promise<T>;
  }

  const p = (async () => {
    try {
      const value = await load();
      const ttl = value == null ? Math.min(ttlSeconds, NONE_TTL_SECONDS) : ttlSeconds;
      const stored = (value ?? NONE) as object;
      const expiresAt = new Date(Date.now() + ttl * 1000);
      await db
        .insert(schema.dataCache)
        .values({ key, value: stored, expiresAt })
        .onConflictDoUpdate({ target: schema.dataCache.key, set: { value: stored, expiresAt } });
      coolingDown.delete(key);
      return value;
    } catch (err) {
      coolingDown.set(key, Date.now() + COOLDOWN_MS);
      if (stale !== undefined) return stale;
      throw err;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  // Stale-while-revalidate: just expired, the visitor gets it at once and the refresh runs behind
  // (it can't reject: with a stale value it falls back to it). Older than that, wait for fresh data.
  if (stale !== undefined && recent(hit!.expiresAt, ttlSeconds)) return stale;
  return p;
}

/** Expired less than 3 lifetimes ago (and never more than an hour): still fine to show while refreshing. */
const recent = (expiresAt: Date, ttlSeconds: number) => Date.now() - expiresAt.getTime() < Math.min(3 * ttlSeconds, 3_600) * 1000;

export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`${new URL(url).host} responded ${res.status}`);
  return res.json() as Promise<T>;
}

/** Drops expired entries (run by the hourly job, so the table doesn't grow forever). */
export async function purgeExpiredCache() {
  for (const [key, until] of coolingDown) if (until < Date.now()) coolingDown.delete(key);
  await db.delete(schema.dataCache).where(lt(schema.dataCache.expiresAt, new Date(Date.now() - 24 * 3_600_000)));
}
