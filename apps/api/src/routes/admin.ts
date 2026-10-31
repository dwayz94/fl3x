import type { FastifyInstance } from "fastify";
import { timingSafeEqual } from "node:crypto";
import bs58 from "bs58";
import { arrayContains, arrayOverlaps, desc, eq, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { BADGES, siteSettingsSchema } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { generateCode } from "../lib/codes";
import { badRequest, forbidden, notFound } from "../lib/errors";
import { getSettings, saveSettings } from "../lib/settings";
import { refreshTier, refreshTiersForWallets } from "../lib/users";
import { isSolanaAddress } from "../lib/wallets";

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

const addGrants = z.object({
  /** A list, or pasted text: addresses separated by new lines, commas or spaces. */
  addresses: z.union([z.array(z.string().max(200)).max(2000), z.string().max(100_000)]),
  tier: z.enum(["starter", "premium"]).default("premium"),
  note: z.string().trim().max(200).optional(),
});

/** A real Solana public key: base58, 32–44 chars, decoding to 32 bytes. */
function isSolanaKey(a: string) {
  if (!isSolanaAddress(a)) return false;
  try {
    return bs58.decode(a).length === 32;
  } catch {
    return false;
  }
}

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

  /**
   * Wallet grants (giveaways): Solana addresses that get a tier, whether or
   * not someone joined with them yet. Each one shows the member who holds it
   * now (linked by signature first, else as an unclaimed sign-in wallet).
   */
  app.get("/admin/wallet-grants", async () => {
    const grants = await db.select().from(schema.walletGrants).orderBy(desc(schema.walletGrants.createdAt), schema.walletGrants.address);
    const addresses = grants.map((g) => g.address);
    const holder = new Map<string, { id: string; username: string | null; tier: string }>();
    if (addresses.length) {
      const linked = await db
        .select({ address: schema.wallets.address, id: schema.users.id, username: schema.users.username, tier: schema.users.tier })
        .from(schema.wallets)
        .innerJoin(schema.users, eq(schema.users.id, schema.wallets.userId))
        .where(inArray(schema.wallets.address, addresses));
      for (const l of linked) holder.set(l.address, { id: l.id, username: l.username, tier: l.tier });
      const login = await db
        .select({ id: schema.users.id, username: schema.users.username, tier: schema.users.tier, wallets: schema.users.wallets })
        .from(schema.users)
        .where(arrayOverlaps(schema.users.wallets, addresses));
      for (const u of login) for (const a of u.wallets) if (addresses.includes(a) && !holder.has(a)) holder.set(a, { id: u.id, username: u.username, tier: u.tier });
    }
    return grants.map((g) => ({ address: g.address, tier: g.tier, note: g.note, createdAt: g.createdAt, member: holder.get(g.address) ?? null }));
  });

  /** Paste many addresses at once: deduped, invalid ones reported. Members already holding one get the tier now. */
  app.post("/admin/wallet-grants", async (req) => {
    const body = addGrants.parse(req.body);
    const raw = (Array.isArray(body.addresses) ? body.addresses : body.addresses.split(/[\s,;]+/)).map((a) => a.trim()).filter(Boolean);
    const unique = [...new Set(raw)];
    const valid = unique.filter(isSolanaKey);
    const invalid = unique.filter((a) => !isSolanaKey(a));
    if (valid.length > 2000) throw badRequest("At most 2000 addresses at once");
    const added = valid.length
      ? (await db
          .insert(schema.walletGrants)
          .values(valid.map((address) => ({ address, tier: body.tier, note: body.note || null })))
          .onConflictDoNothing()
          .returning({ address: schema.walletGrants.address })).map((r) => r.address)
      : [];
    await refreshTiersForWallets(added);
    return { added: added.length, existing: valid.length - added.length, invalid: invalid.length, invalidSamples: invalid.slice(0, 200) };
  });

  /** Take a grant back; whoever holds the wallet falls back to their own tier now. */
  app.delete<{ Params: { address: string } }>("/admin/wallet-grants/:address", async (req) => {
    const [row] = await db.delete(schema.walletGrants).where(eq(schema.walletGrants.address, req.params.address)).returning();
    if (!row) throw notFound("No such grant");
    await refreshTiersForWallets([row.address]);
    return { ok: true };
  });
}
