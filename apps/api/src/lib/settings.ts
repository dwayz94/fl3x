import { eq } from "drizzle-orm";
import { siteSettingsSchema, type SiteSettings } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";

const KEY = "site";
const TTL_MS = 10_000;

/** What the API env says: the starting point until something is saved from /admin. */
function fromEnv(): SiteSettings {
  return {
    phase: env.LAUNCH_PHASE,
    tokenMint: env.TOKEN_MINT,
    thresholds: { starter: env.TIER_STARTER_MIN, premium: env.TIER_PREMIUM_MIN },
    banner:
      env.BANNER_TEXT === "off"
        ? "off"
        : env.BANNER_TEXT
          ? {
              text: env.BANNER_TEXT,
              detail: env.BANNER_DETAIL || null,
              link: env.BANNER_LINK_LABEL && env.BANNER_LINK_URL ? { label: env.BANNER_LINK_LABEL, url: env.BANNER_LINK_URL } : null,
            }
          : null,
  };
}

let cache: { at: number; value: SiteSettings } | null = null;

/** Live settings: saved values over env defaults. Cached 10 s, so a save shows up almost at once. */
export async function getSettings(): Promise<SiteSettings> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, KEY)).limit(1);
  const saved = siteSettingsSchema.partial().safeParse(row?.value ?? {});
  const value = { ...fromEnv(), ...(saved.success ? saved.data : {}) };
  cache = { at: Date.now(), value };
  return value;
}

/** Saves a full settings object (validated by the caller) and drops the cache. */
export async function saveSettings(value: SiteSettings): Promise<SiteSettings> {
  await db
    .insert(schema.appSettings)
    .values({ key: KEY, value, updatedAt: new Date() })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value, updatedAt: new Date() } });
  cache = null;
  return getSettings();
}
