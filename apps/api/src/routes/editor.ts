import type { FastifyInstance } from "fastify";
import { and, count, eq, notInArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  DEFAULT_THEME, PREMIUM_THEME_KEYS, TIER_LIMITS, isAnimatedBackground, identityInput, linksInput, profileInput, widgetsInput,
  type ProfileTheme,
} from "@fl3x/shared";
import { db, schema } from "../db";
import { requireUser } from "../lib/auth";
import { badRequest, forbidden } from "../lib/errors";
import { badgesFor, loadProfile } from "../lib/profiles";
import { refreshTier, type UserRow } from "../lib/users";
import { verifiedWallets } from "../lib/wallets";

async function requireMember(req: Parameters<typeof requireUser>[0]): Promise<UserRow> {
  const user = await requireUser(req);
  if (!user.username) throw forbidden("Claim a username first");
  // Limits follow the tokens held right now (cached 10 minutes), not the last /me call.
  return refreshTier(user);
}

export async function editorRoutes(app: FastifyInstance) {
  app.get("/me/profile", async (req) => {
    const user = await requireMember(req);
    return { profile: await loadProfile(user), ownedBadges: await badgesFor(user), limits: TIER_LIMITS[user.tier] };
  });

  app.put("/me/profile", async (req) => {
    const user = await requireMember(req);
    const body = profileInput.parse(req.body);
    const owned = new Set(await badgesFor(user));
    const theme = { ...body.theme } as ProfileTheme;
    if (user.tier !== "premium") {
      for (const key of PREMIUM_THEME_KEYS) (theme as unknown as Record<string, unknown>)[key] = DEFAULT_THEME[key];
      // Animated backgrounds are Premium too.
      if (isAnimatedBackground(theme.background)) theme.background = "plain";
    }
    await db
      .update(schema.profiles)
      .set({
        displayName: body.displayName || null,
        bio: body.bio || null,
        avatarUrl: body.avatarUrl || null,
        badges: body.badges.filter((b) => owned.has(b)),
        theme,
        updatedAt: new Date(),
      })
      .where(eq(schema.profiles.userId, user.id));
    return loadProfile(user);
  });

  app.patch("/me/identity", async (req) => {
    const user = await requireMember(req);
    const body = identityInput.parse(req.body);
    const set: Partial<typeof schema.profiles.$inferInsert> = { updatedAt: new Date() };
    if (body.displayName !== undefined) set.displayName = body.displayName || null;
    if (body.bio !== undefined) set.bio = body.bio || null;
    if (body.avatarUrl !== undefined) set.avatarUrl = body.avatarUrl || null;
    await db.update(schema.profiles).set(set).where(eq(schema.profiles.userId, user.id));
    return loadProfile(user);
  });

  /** Replaces the whole widget layout (the editor saves it as one unit). */
  app.put("/me/widgets", async (req) => {
    const user = await requireMember(req);
    const widgets = widgetsInput.parse(req.body);
    const limit = TIER_LIMITS[user.tier].widgets;
    // Over the limit (tier dropped, limits lowered) you can still edit and remove, just not add.
    const [{ current } = { current: 0 }] = await db.select({ current: count() }).from(schema.widgets).where(eq(schema.widgets.userId, user.id));
    if (widgets.length > Math.max(limit, current)) throw badRequest(`Your tier allows ${limit} widgets`, "limit_reached");
    const verified = new Set((await verifiedWallets(user)).map((v) => v.address.toLowerCase()));
    for (const w of widgets) {
      const picked = typeof w.settings.wallets === "string" && w.settings.wallets !== "all" ? w.settings.wallets.split(",") : [];
      if (picked.some((a) => !verified.has(a.trim().toLowerCase()))) {
        throw badRequest("Only your verified wallets can be displayed", "wallet_not_verified");
      }
    }
    // Upsert by id (not delete + insert) so widget reactions survive edits.
    const rows = widgets.map((w, position) => ({ id: w.id ?? randomUUID(), userId: user.id, type: w.type, size: w.size, settings: w.settings, position }));
    await db.transaction(async (tx) => {
      const keep = rows.map((r) => r.id);
      await tx
        .delete(schema.widgets)
        .where(keep.length ? and(eq(schema.widgets.userId, user.id), notInArray(schema.widgets.id, keep)) : eq(schema.widgets.userId, user.id));
      for (const row of rows) {
        await tx
          .insert(schema.widgets)
          .values(row)
          .onConflictDoUpdate({
            target: schema.widgets.id,
            set: { type: row.type, size: row.size, settings: row.settings, position: row.position },
            // Never let someone overwrite another user's widget by guessing its id.
            setWhere: sql`${schema.widgets.userId} = ${user.id}`,
          });
      }
    });
    return (await loadProfile(user)).widgets;
  });

  app.put("/me/links", async (req) => {
    const user = await requireMember(req);
    const links = linksInput.parse(req.body);
    const limit = TIER_LIMITS[user.tier].links;
    const [{ current } = { current: 0 }] = await db.select({ current: count() }).from(schema.links).where(eq(schema.links.userId, user.id));
    if (links.length > Math.max(limit, current)) throw badRequest(`Your tier allows ${limit} links`, "limit_reached");
    await db.transaction(async (tx) => {
      await tx.delete(schema.links).where(eq(schema.links.userId, user.id));
      if (links.length) {
        await tx.insert(schema.links).values(
          links.map((l, position) => ({ id: l.id, userId: user.id, kind: l.kind, url: l.url, label: l.label ?? null, position })),
        );
      }
    });
    return (await loadProfile(user)).links;
  });
}
