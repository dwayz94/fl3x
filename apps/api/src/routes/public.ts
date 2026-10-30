import type { FastifyInstance } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { normalizeUsername, validateUsername, type FullPublicProfile, type PublicConfig } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { getSettings } from "../lib/settings";
import { notFound } from "../lib/errors";
import { badgesFor, badgeStats, loadProfile } from "../lib/profiles";
import { resolveInviteCode } from "../lib/invites";
import { isUsernameTaken } from "../lib/users";

export async function publicRoutes(app: FastifyInstance) {

  app.get("/config", async (): Promise<PublicConfig> => {
    const settings = await getSettings();
    return { phase: settings.phase, token: { symbol: env.TOKEN_SYMBOL, mint: settings.tokenMint }, thresholds: settings.thresholds, banner: settings.banner };
  });

  app.get<{ Params: { username: string } }>("/usernames/:username", async (req) => {
    const check = validateUsername(req.params.username);
    if (!check.valid) return { available: false, reason: check.message };
    const taken = await isUsernameTaken(normalizeUsername(req.params.username));
    return { available: !taken, reason: taken ? "This username is already taken" : null };
  });

  app.get<{ Params: { code: string } }>("/invites/:code", async (req) => {
    const code = await resolveInviteCode(req.params.code);
    if (!code) return { valid: false, inviter: null };
    const [row] = await db
      .select({ invite: schema.inviteCodes, inviter: schema.users.username })
      .from(schema.inviteCodes)
      .leftJoin(schema.users, eq(schema.users.id, schema.inviteCodes.ownerId))
      .where(eq(schema.inviteCodes.code, code))
      .limit(1);
    if (!row) return { valid: false, inviter: null };
    const { invite } = row;
    const expired = invite.expiresAt && invite.expiresAt < new Date();
    return { valid: !expired && invite.uses < invite.maxUses, inviter: row.inviter };
  });

  app.get<{ Params: { username: string } }>("/profiles/:username", async (req): Promise<FullPublicProfile> => {
    const [row] = await db
      .select({ user: schema.users, published: schema.profiles.isPublished })
      .from(schema.users)
      .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .where(eq(schema.users.username, normalizeUsername(req.params.username)))
      .limit(1);
    if (!row || !row.published) throw notFound("Profile not found");
    const [{ views } = { views: 0 }] = await db
      .select({ views: sql<number>`count(*)::int` })
      .from(schema.profileEvents)
      .where(and(eq(schema.profileEvents.profileUserId, row.user.id), eq(schema.profileEvents.kind, "view")));
    const profile = await loadProfile(row.user);
    const stats = await badgeStats(row.user);
    // Only show badges still owned (a tier can drop, a granted badge can be taken back).
    const owned = new Set(await badgesFor(row.user, stats));
    // Which wallets a widget adds up stays private: the page fetches values by widget id.
    const widgets = profile.widgets.map((w) => {
      if (!("wallets" in w.settings)) return w;
      const { wallets: _hidden, ...settings } = w.settings;
      return { ...w, settings };
    });
    return {
      ...profile,
      widgets,
      badges: profile.badges.filter((b) => owned.has(b)),
      badgeStats: stats,
      tier: row.user.tier,
      xHandle: row.user.xHandle,
      views,
    };
  });

  app.get<{ Params: { id: string } }>("/widgets/:id/reactions", async (req) => {
    const id = z.uuid().parse(req.params.id);
    const rows = await db.select().from(schema.widgetReactions).where(eq(schema.widgetReactions.widgetId, id));
    return Object.fromEntries(rows.map((r) => [r.emoji, r.count]));
  });

  app.post<{ Params: { id: string } }>(
    "/widgets/:id/reactions",
    { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } },
    async (req) => {
      const id = z.uuid().parse(req.params.id);
      const { emoji } = z.object({ emoji: z.string().min(1).max(16) }).parse(req.body);
      const [widget] = await db.select().from(schema.widgets).where(and(eq(schema.widgets.id, id), eq(schema.widgets.type, "reactions"))).limit(1);
      if (!widget) throw notFound();
      const allowed = [...new Intl.Segmenter().segment(String(widget.settings.emojis || "🤑😈💀🤡🤖"))].map((s) => s.segment);
      if (!allowed.includes(emoji)) throw notFound("Emoji not allowed here");
      const [row] = await db
        .insert(schema.widgetReactions)
        .values({ widgetId: id, emoji, count: 1 })
        .onConflictDoUpdate({
          target: [schema.widgetReactions.widgetId, schema.widgetReactions.emoji],
          set: { count: sql`${schema.widgetReactions.count} + 1` },
        })
        .returning();
      return { emoji, count: row!.count };
    },
  );
}
