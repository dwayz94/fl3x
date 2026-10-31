import type { FastifyInstance } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { arrayContains, eq, or, sql } from "drizzle-orm";
import { z } from "zod";
import { BADGES, siteSettingsSchema } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { generateCode } from "../lib/codes";
import { forbidden, notFound } from "../lib/errors";
import { getSettings, saveSettings } from "../lib/settings";
import { refreshTier } from "../lib/users";

const createInvites = z.object({
  count: z.number().int().min(1).max(500).default(1),
  maxUses: z.number().int().min(1).max(10_000).default(1),
  note: z.string().max(200).optional(),
});

function isAdminKey(given: unknown) {
  if (typeof given !== "string" || !env.ADMIN_API_KEY) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(env.ADMIN_API_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}

const grantable = BADGES.filter((b) => b.unlock.kind === "granted").map((b) => b.id) as [string, ...string[]];
const grantBadge = z.object({ username: z.string().min(1), badge: z.enum(grantable), granted: z.boolean().default(true) });

const memberUpdate = z.object({
  founder: z.boolean().optional(),
  tierOverride: z.enum(["starter", "premium"]).nullable().optional(),
  badges: z.array(z.enum(grantable)).max(grantable.length).optional(),
});

/** What /admin shows about a member. */
async function adminUser(u: typeof schema.users.$inferSelect) {
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, u.id)).limit(1);
  const wallets = await db.select({ chain: schema.wallets.chain, address: schema.wallets.address }).from(schema.wallets).where(eq(schema.wallets.userId, u.id));
  return {
    id: u.id,
    username: u.username,
    xHandle: u.xHandle,
    tier: u.tier,
    tierOverride: u.tierOverride,
    founder: u.role === "admin",
    badges: u.grantedBadges,
    tokenBalance: u.tokenBalance,
    createdAt: u.createdAt,
    onboardedAt: u.onboardedAt,
    signInWallets: u.wallets,
    linkedWallets: wallets,
    profile: profile ? { displayName: profile.displayName, avatarUrl: profile.avatarUrl ?? u.xAvatarUrl, published: profile.isPublished } : null,
  };
}

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (req) => {
    if (!isAdminKey(req.headers["x-admin-key"])) throw forbidden();
  });

  /**
   * Find an account from anything we know about it: its permanent internal
   * ID (UUID, never shown publicly), username, X handle or a wallet address.
   * The ID never changes, even if the username or the X account does.
   */
  app.get("/admin/users/lookup", async (req) => {
    const { q } = z.object({ q: z.string().trim().min(2).max(100) }).parse(req.query);
    const term = q.replace(/^@/, "");
    const isUuid = z.uuid().safeParse(term).success;
    const linked = await db.select({ userId: schema.wallets.userId }).from(schema.wallets).where(eq(schema.wallets.address, term.startsWith("0x") ? term.toLowerCase() : term));
    const users = await db
      .select()
      .from(schema.users)
      .where(
        or(
          isUuid ? eq(schema.users.id, term) : undefined,
          eq(schema.users.username, term.toLowerCase()),
          sql`lower(${schema.users.xHandle}) = ${term.toLowerCase()}`,
          arrayContains(schema.users.wallets, [term]),
          ...linked.map((l) => eq(schema.users.id, l.userId)),
        ),
      )
      .limit(10);
    return Promise.all(users.map(adminUser));
  });

  /**
   * Team controls on a member: Founder (staff role), a gifted tier and the
   * team badges. Takes effect at once (the tier is recomputed right away).
   */
  app.patch<{ Params: { id: string } }>("/admin/users/:id", async (req) => {
    if (!z.uuid().safeParse(req.params.id).success) throw notFound("No such user");
    const body = memberUpdate.parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id)).limit(1);
    if (!user) throw notFound("No such user");
    const [row] = await db
      .update(schema.users)
      .set({
        ...(body.founder !== undefined && { role: body.founder ? ("admin" as const) : ("user" as const) }),
        ...(body.tierOverride !== undefined && { tierOverride: body.tierOverride }),
        ...(body.badges !== undefined && { grantedBadges: body.badges }),
      })
      .where(eq(schema.users.id, user.id))
      .returning();
    // What the team just handed out shows on the profile right away (the member can still hide it in Badges).
    const added = [...(body.founder && user.role !== "admin" ? ["founder"] : []), ...(body.badges ?? []).filter((b) => !user.grantedBadges.includes(b))];
    const [profile] = added.length ? await db.select({ badges: schema.profiles.badges }).from(schema.profiles).where(eq(schema.profiles.userId, user.id)).limit(1) : [];
    if (profile) {
      await db
        .update(schema.profiles)
        .set({ badges: [...new Set([...profile.badges, ...added])] })
        .where(eq(schema.profiles.userId, user.id));
    }
    // Founder and a gifted tier both change the tier: recompute it now.
    return adminUser(body.tierOverride !== undefined || body.founder !== undefined ? await refreshTier(row!, true) : row!);
  });

  /** Live site settings (phase, token mint, thresholds, banner): edited from /admin, applied without a restart. */
  app.get("/admin/settings", async () => getSettings());
  app.put("/admin/settings", async (req) => saveSettings(siteSettingsSchema.parse(req.body)));

  /** Mint genesis invite codes (no owner). */
  app.post("/admin/invites", async (req) => {
    const { count, maxUses, note } = createInvites.parse(req.body ?? {});
    const rows = Array.from({ length: count }, () => ({ code: generateCode(), maxUses, note }));
    const created = await db.insert(schema.inviteCodes).values(rows).returning();
    return { codes: created.map((c) => c.code) };
  });

  /** Hand out (or take back) a team badge: Kol, Creator, Builder, Donor, Gifter, Gas Spender, Bug Hunter. */
  app.post("/admin/badges", async (req) => {
    const { username, badge, granted } = grantBadge.parse(req.body);
    const [row] = await db
      .update(schema.users)
      .set({
        grantedBadges: granted
          ? sql`array(select distinct unnest(array_append(${schema.users.grantedBadges}, ${badge})))`
          : sql`array_remove(${schema.users.grantedBadges}, ${badge})`,
      })
      .where(eq(schema.users.username, username.toLowerCase()))
      .returning({ grantedBadges: schema.users.grantedBadges });
    if (!row) throw notFound("No such user");
    return row;
  });
}
