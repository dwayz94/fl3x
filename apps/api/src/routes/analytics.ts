import type { FastifyInstance } from "fastify";
import { createHash } from "node:crypto";
import { and, count, countDistinct, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizeUsername, sourceOf, TIER_LIMITS, type AnalyticsSummary, type TrafficSource } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { requireUser } from "../lib/auth";
import { forbidden, notFound } from "../lib/errors";
import { isInternalRequest } from "../lib/internal";

const trackBody = z.object({
  username: z.string().max(32),
  kind: z.enum(["view", "click"]),
  target: z.string().max(64).optional(),
  ip: z.string().max(64),
  userAgent: z.string().max(500),
  country: z.string().length(2).optional(),
  referrer: z.string().max(500).optional(),
});

function device(ua: string): "desktop" | "mobile" | "tablet" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

function referrerHost(ref?: string) {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname.replace(/^www\./, "");
    return host.endsWith("fl3x.lol") ? null : host;
  } catch {
    return null;
  }
}


export async function analyticsRoutes(app: FastifyInstance) {
  /**
   * Called server-to-server by the web app's /api/track route, which knows
   * the visitor's IP and country (Vercel geo headers).
   */
  app.post("/internal/track", async (req) => {
    if (!isInternalRequest(req.headers["x-internal-key"])) throw forbidden();
    const body = trackBody.parse(req.body);
    if (/bot|crawl|spider|preview|facebookexternalhit|embedly/i.test(body.userAgent)) return { ok: true };
    const [owner] = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.username, normalizeUsername(body.username)))
      .limit(1);
    if (!owner) throw notFound();
    // Daily rotating, salted hash: counts unique visitors without storing IPs.
    const day = new Date().toISOString().slice(0, 10);
    // IP only: the user agent is whatever the client sends, so it can't tell visitors apart (changing it would fake views).
    const visitorHash = createHash("sha256").update(`${env.ANALYTICS_SALT}:${day}:${body.ip}`).digest("hex").slice(0, 32);
    // The hash rotates daily, so this counts today only: one view per visitor and
    // profile, and a cap on clicks. Keeps the public counter honest.
    const [{ seen } = { seen: 0 }] = await db
      .select({ seen: count() })
      .from(schema.profileEvents)
      .where(and(eq(schema.profileEvents.profileUserId, owner.id), eq(schema.profileEvents.visitorHash, visitorHash), eq(schema.profileEvents.kind, body.kind)));
    if (body.kind === "view" ? seen > 0 : seen >= 30) return { ok: true };
    await db.insert(schema.profileEvents).values({
      profileUserId: owner.id,
      kind: body.kind,
      target: body.kind === "click" ? (body.target ?? null) : null,
      visitorHash,
      country: body.country?.toUpperCase() ?? null,
      device: device(body.userAgent),
      referrer: referrerHost(body.referrer),
    });
    return { ok: true };
  });

  app.get("/me/analytics", async (req): Promise<AnalyticsSummary> => {
    const user = await requireUser(req);
    const asked = z.object({ days: z.coerce.number().int().min(1).max(365).default(30) }).parse(req.query).days;
    // History depends on the tier (7 / 30 / 90 days).
    const days = Math.min(asked, TIER_LIMITS[user.tier].analyticsDays);
    const from = new Date(Date.now() - days * 86_400_000);
    const e = schema.profileEvents;
    const mine = eq(e.profileUserId, user.id);
    const inRange = and(mine, gte(e.createdAt, from));
    const views = and(inRange, eq(e.kind, "view"));

    const [totals, realtime, daily, clicks, devices, countries, referrers] = await Promise.all([
      db.select({ views: count(), unique: countDistinct(e.visitorHash) }).from(e).where(views),
      db.select({ n: countDistinct(e.visitorHash) }).from(e).where(and(mine, gte(e.createdAt, new Date(Date.now() - 5 * 60_000)))),
      db
        .select({ date: sql<string>`to_char(date_trunc('day', ${e.createdAt}), 'YYYY-MM-DD')`, views: count() })
        .from(e)
        .where(views)
        .groupBy(sql`1`)
        .orderBy(sql`1`),
      db.select({ target: e.target, count: count() }).from(e).where(and(inRange, eq(e.kind, "click"), isNotNull(e.target))).groupBy(e.target).orderBy(desc(count())).limit(10),
      db.select({ device: e.device, count: count() }).from(e).where(views).groupBy(e.device),
      db.select({ country: e.country, count: count() }).from(e).where(and(views, isNotNull(e.country))).groupBy(e.country).orderBy(desc(count())).limit(20),
      db.select({ referrer: e.referrer, count: count() }).from(e).where(views).groupBy(e.referrer).orderBy(desc(count())),
    ]);

    // Group referrer hosts into sources (t.co and x.com are both X, no referrer is Direct).
    const bySource = new Map<TrafficSource, number>();
    for (const r of referrers) {
      const s = sourceOf(r.referrer);
      bySource.set(s, (bySource.get(s) ?? 0) + r.count);
    }

    // Fill missing days so the chart has a point per day.
    const byDay = new Map(daily.map((d) => [d.date, d.views]));
    const series: AnalyticsSummary["daily"] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      series.push({ date, views: byDay.get(date) ?? 0 });
    }

    return {
      range: { from: from.toISOString(), to: new Date().toISOString() },
      totalViews: totals[0]?.views ?? 0,
      uniqueVisitors: totals[0]?.unique ?? 0,
      realtime: realtime[0]?.n ?? 0,
      daily: series,
      clicks: clicks.map((c) => ({ target: c.target!, count: c.count })),
      devices,
      countries: countries.map((c) => ({ country: c.country!, count: c.count })),
      referrers: referrers.filter((r) => r.referrer).slice(0, 10).map((r) => ({ referrer: r.referrer!, count: r.count })),
      sources: [...bySource].map(([source, n]) => ({ source, count: n })).sort((a, b) => b.count - a.count),
    };
  });
}
