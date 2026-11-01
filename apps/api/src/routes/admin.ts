import type { FastifyInstance } from "fastify";
import { randomUUID, timingSafeEqual } from "node:crypto";
import bs58 from "bs58";
import { and, arrayContains, arrayOverlaps, desc, eq, inArray, isNotNull, or, sql } from "drizzle-orm";
import { z } from "zod";
import { BADGES, normalizeUsername, siteSettingsSchema, validateUsername } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { generateCode } from "../lib/codes";
import { badRequest, conflict, forbidden, notFound } from "../lib/errors";
import { previewCode, signTeamSession } from "../lib/secrets";
import { rebuildHistory } from "../lib/providers/history";
import { getSettings, saveSettings } from "../lib/settings";
import { isUsernameTaken, refreshTier, refreshTiersForWallets } from "../lib/users";
import { chainOf, isSolanaAddress, normalizeAddress } from "../lib/wallets";

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

const reserveProfile = z.object({
  username: z.string().trim().min(1).max(40),
  xHandle: z.string().trim().regex(/^@?[A-Za-z0-9_]{1,15}$/, "Not an X handle"),
  displayName: z.string().trim().max(40).optional(),
  tier: z.enum(["starter", "premium"]).optional(),
});

async function reservedUser(id: string) {
  if (!z.uuid().safeParse(id).success) throw notFound("No such reserved profile");
  const [user] = await db.select().from(schema.users).where(and(eq(schema.users.id, id), isNotNull(schema.users.reservedFor))).limit(1);
  if (!user) throw notFound("No such reserved profile (already taken over?)");
  return user;
}

/** What /admin shows about a member. */
async function adminUser(u: typeof schema.users.$inferSelect) {
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, u.id)).limit(1);
  const wallets = await db.select({ id: schema.wallets.id, chain: schema.wallets.chain, address: schema.wallets.address, signed: schema.wallets.signed }).from(schema.wallets).where(eq(schema.wallets.userId, u.id));
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
    /** Made ahead by the team, waiting for this X handle to sign in. */
    reservedFor: u.reservedFor,
    previewCode: u.reservedFor && u.username ? previewCode(u.username) : null,
    profile: profile ? { displayName: profile.displayName, avatarUrl: profile.avatarUrl ?? u.xAvatarUrl, published: profile.isPublished } : null,
  };
}

export async function adminRoutes(app: FastifyInstance) {
  // Without the key, these routes answer exactly like a route that doesn't exist: nothing tells they're here.
  app.addHook("onRequest", async (req, reply) => {
    if (!isAdminKey(req.headers["x-admin-key"])) return reply.code(404).send({ message: `Route ${req.method}:${req.url} not found`, error: "Not Found", statusCode: 404 });
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

  /**
   * Reserved profiles: the team claims a handle for someone known and builds
   * their profile ahead. Hidden from the public (except the private preview
   * link) until that X account signs in, which takes the account over.
   */
  app.get("/admin/reserved", async () => {
    const rows = await db.select().from(schema.users).where(isNotNull(schema.users.reservedFor)).orderBy(desc(schema.users.createdAt));
    return Promise.all(rows.map(adminUser));
  });

  app.post("/admin/reserved", async (req) => {
    const body = reserveProfile.parse(req.body);
    const username = normalizeUsername(body.username);
    const check = validateUsername(username);
    if (!check.valid) throw badRequest(check.message, "bad_username");
    if (await isUsernameTaken(username)) throw conflict("This username is already taken", "username_taken");
    const handle = body.xHandle.replace(/^@/, "");
    const [existing] = await db
      .select({ username: schema.users.username })
      .from(schema.users)
      .where(or(sql`lower(${schema.users.xHandle}) = ${handle.toLowerCase()}`, eq(schema.users.reservedFor, handle.toLowerCase())))
      .limit(1);
    if (existing) throw conflict(`@${handle} already has a FL3X account${existing.username ? ` (@${existing.username})` : ""}`, "x_taken");
    const user = await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(schema.users)
        .values({ privyId: `reserved:${randomUUID()}`, username, xHandle: handle, reservedFor: handle.toLowerCase(), tierOverride: body.tier ?? null, onboardedAt: new Date() })
        .returning();
      await tx.insert(schema.profiles).values({ userId: row!.id, displayName: body.displayName || handle });
      return row!;
    });
    return adminUser(await refreshTier(user, true));
  });

  /** A session to build the profile in the dashboard. Only while nobody has taken the account over. */
  app.post<{ Params: { id: string } }>("/admin/reserved/:id/session", async (req) => {
    const user = await reservedUser(req.params.id);
    return { token: signTeamSession(user.id), username: user.username };
  });

  app.delete<{ Params: { id: string } }>("/admin/reserved/:id", async (req) => {
    const user = await reservedUser(req.params.id);
    await db.delete(schema.users).where(and(eq(schema.users.id, user.id), isNotNull(schema.users.reservedFor)));
    return { ok: true };
  });

  /**
   * Founders and reserved profiles can show any address in their wallet
   * widgets, without a signature. Never counts for a tier; a real signature
   * on the same address takes it over.
   */
  app.post<{ Params: { id: string } }>("/admin/users/:id/wallets", async (req) => {
    if (!z.uuid().safeParse(req.params.id).success) throw notFound("No such user");
    const body = z.object({ address: z.string().trim().min(32).max(64), label: z.string().trim().max(40).optional() }).parse(req.body);
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id)).limit(1);
    if (!user) throw notFound("No such user");
    if (user.role !== "admin" && !user.reservedFor) throw forbidden("Only founders and reserved profiles");
    const chain = chainOf(body.address);
    if (!chain) throw badRequest("Unknown wallet address format", "bad_address");
    const address = normalizeAddress(chain, body.address);
    const [taken] = await db.select({ userId: schema.wallets.userId }).from(schema.wallets).where(and(eq(schema.wallets.chain, chain), eq(schema.wallets.address, address))).limit(1);
    if (taken) throw conflict(taken.userId === user.id ? "Already on this account" : "This wallet is linked to another FL3X account", "wallet_taken");
    await db.insert(schema.wallets).values({ userId: user.id, chain, address, label: body.label || null, signed: false });
    return adminUser(user);
  });

  app.delete<{ Params: { id: string; walletId: string } }>("/admin/users/:id/wallets/:walletId", async (req) => {
    if (!z.uuid().safeParse(req.params.id).success || !z.uuid().safeParse(req.params.walletId).success) throw notFound("No such wallet");
    const [row] = await db
      .delete(schema.wallets)
      .where(and(eq(schema.wallets.id, req.params.walletId), eq(schema.wallets.userId, req.params.id), eq(schema.wallets.signed, false)))
      .returning();
    if (!row) throw notFound("No such wallet");
    const [user] = await db.select().from(schema.users).where(eq(schema.users.id, req.params.id)).limit(1);
    return adminUser(user!);
  });

  /** Redo a wallet's past rebuilt from the chain (P&L and portfolio history before our hourly snapshots). */
  app.post("/admin/history/rebuild", async (req) => {
    const { address } = z.object({ address: z.string().trim().min(32).max(64) }).parse(req.body);
    const chain = chainOf(address);
    if (!chain) throw badRequest("Unknown wallet address format", "bad_address");
    await rebuildHistory(normalizeAddress(chain, address), (m) => req.log.warn(m));
    return { started: true };
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

  /**
   * Paste many addresses at once: deduped, invalid ones reported. Members already holding one get the tier now.
   * Re-pasting a granted address with another tier / note updates it (an empty note keeps the old one).
   */
  app.post("/admin/wallet-grants", async (req) => {
    const body = addGrants.parse(req.body);
    const raw = (Array.isArray(body.addresses) ? body.addresses : body.addresses.split(/[\s,;]+/)).map((a) => a.trim()).filter(Boolean);
    const unique = [...new Set(raw)];
    const valid = unique.filter(isSolanaKey);
    const invalid = unique.filter((a) => !isSolanaKey(a));
    if (valid.length > 2000) throw badRequest("At most 2000 addresses at once");
    const g = schema.walletGrants;
    // Only rows that change come back; `xmax = 0` tells a fresh insert from an update.
    const changed = valid.length
      ? await db
          .insert(g)
          .values(valid.map((address) => ({ address, tier: body.tier, note: body.note || null })))
          .onConflictDoUpdate({
            target: g.address,
            set: { tier: sql`excluded.tier`, note: sql`coalesce(excluded.note, ${g.note})` },
            setWhere: sql`(${g.tier}, ${g.note}) is distinct from (excluded.tier, coalesce(excluded.note, ${g.note}))`,
          })
          .returning({ address: g.address, inserted: sql<boolean>`(xmax = 0)` })
      : [];
    await refreshTiersForWallets(changed.map((r) => r.address));
    const added = changed.filter((r) => r.inserted).length;
    const updated = changed.length - added;
    return { added, updated, existing: valid.length - changed.length, invalid: invalid.length, invalidSamples: invalid.slice(0, 200) };
  });

  /** Take a grant back; whoever holds the wallet falls back to their own tier now. */
  app.delete<{ Params: { address: string } }>("/admin/wallet-grants/:address", async (req) => {
    const [row] = await db.delete(schema.walletGrants).where(eq(schema.walletGrants.address, req.params.address)).returning();
    if (!row) throw notFound("No such grant");
    await refreshTiersForWallets([row.address]);
    return { ok: true };
  });
}
