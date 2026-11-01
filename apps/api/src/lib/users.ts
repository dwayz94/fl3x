import { and, arrayOverlaps, count, eq, inArray, isNull, ne, or, sql } from "drizzle-orm";
import { TIER_LIMITS, tierForBalance, type Me } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { generateCode } from "./codes";
import { getSettings } from "./settings";
import { devAuth, fetchIdentity } from "./privy";
import { totalTokenBalance } from "./solana";
import { verifiedWallets } from "./wallets";

export type UserRow = typeof schema.users.$inferSelect;

// Token holdings are re-read at most every 5 minutes per member (on any action, and by the job in index.ts).
export const TIER_TTL_MS = 5 * 60 * 1000;

/** Create or refresh the local user from Privy's linked accounts. */
export async function syncUser(privyId: string): Promise<UserRow> {
  // A reserved profile opened by the team: no Privy account behind it yet.
  if (privyId.startsWith("reserved:")) {
    const [row] = await db.select().from(schema.users).where(eq(schema.users.privyId, privyId)).limit(1);
    return refreshTier(row!);
  }
  const identity = await fetchIdentity(privyId);
  const claimed = await takeOverReserved(privyId, identity.xHandle, identity);
  if (claimed) return refreshTier(claimed, true);
  const [row] = await db
    .insert(schema.users)
    .values({ privyId, ...identity })
    .onConflictDoUpdate({ target: schema.users.privyId, set: identity })
    .returning();
  return refreshTier(row!, true);
}

/**
 * First sign-in of an X account the team made a profile for: that account
 * becomes theirs (username, profile, widgets), instead of a new empty one.
 */
async function takeOverReserved(privyId: string, xHandle: string | null, identity: Partial<UserRow>): Promise<UserRow | null> {
  if (!xHandle) return null;
  const [known] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.privyId, privyId)).limit(1);
  if (known) return null;
  const [row] = await db
    .update(schema.users)
    .set({ ...identity, privyId, reservedFor: null })
    .where(and(eq(schema.users.reservedFor, xHandle.toLowerCase()), sql`${schema.users.privyId} like 'reserved:%'`))
    .returning();
  // Their own invite code starts now: before, /invite/<handle> would have shown the profile exists.
  if (row) await db.insert(schema.inviteCodes).values({ code: generateCode(), ownerId: row.id, maxUses: TIER_LIMITS[row.tier].invites });
  return row ?? null;
}

const RANK = { none: 0, starter: 1, premium: 2 } as const;
/** A tier given from /admin is a floor: holding more still counts. */
const withOverride = (tier: keyof typeof RANK, override: UserRow["tierOverride"]) => (override && RANK[override] > RANK[tier] ? override : tier);
/** Founders (the team, `role: admin`) get everything: Premium whatever they hold. */
const floorOf = (user: UserRow): UserRow["tierOverride"] => (user.role === "admin" ? "premium" : user.tierOverride);
/** Founder, gifted tier and wallet grants are all floors: the highest one wins. */
const highest = (a: UserRow["tierOverride"], b: UserRow["tierOverride"]): UserRow["tierOverride"] => (a && b ? (RANK[a] >= RANK[b] ? a : b) : (a ?? b));

/**
 * The Solana wallets that count for this member's tier: wallets linked by
 * signature, plus sign-in wallets no other account linked by signature (the
 * same tokens, or the same giveaway grant, must never tier two accounts).
 */
async function tierWallets(user: UserRow): Promise<string[]> {
  // Wallets the team added without a signature (founders, reserved profiles) show in widgets but never tier anyone.
  const linked = await db.select({ address: schema.wallets.address }).from(schema.wallets).where(and(eq(schema.wallets.userId, user.id), eq(schema.wallets.chain, "solana"), eq(schema.wallets.signed, true)));
  const login = user.wallets.filter((a) => !a.startsWith("0x"));
  const claimed = login.length
    ? new Set((await db.select({ address: schema.wallets.address }).from(schema.wallets).where(and(inArray(schema.wallets.address, login), ne(schema.wallets.userId, user.id), eq(schema.wallets.signed, true)))).map((r) => r.address))
    : new Set<string>();
  // $FL3X is a Solana token: only Solana addresses count (sign-in wallets can be EVM too).
  return [...new Set([...login.filter((a) => !claimed.has(a)), ...linked.map((l) => l.address)].filter((a) => !a.startsWith("0x")))];
}

/** The best tier granted from /admin to any of these wallets (giveaways), or null. */
async function grantFor(addresses: string[]): Promise<UserRow["tierOverride"]> {
  if (addresses.length === 0) return null;
  const grants = await db.select({ tier: schema.walletGrants.tier }).from(schema.walletGrants).where(inArray(schema.walletGrants.address, addresses));
  return grants.reduce<UserRow["tierOverride"]>((best, g) => highest(best, g.tier), null);
}

export async function refreshTier(user: UserRow, force = false): Promise<UserRow> {
  const fresh = user.tierCheckedAt && Date.now() - user.tierCheckedAt.getTime() < TIER_TTL_MS;
  if (fresh && !force) return user;
  let floor = floorOf(user);
  try {
    const solana = await tierWallets(user);
    floor = highest(floor, await grantFor(solana));
    if (devAuth && env.DEV_TIER && user.privyId.startsWith("did:dev:")) {
      const [row] = await db.update(schema.users).set({ tier: withOverride(env.DEV_TIER, floor), tierCheckedAt: new Date() }).where(eq(schema.users.id, user.id)).returning();
      if (row!.tier !== user.tier) await syncInviteSeats(row!);
      return row!;
    }
    const balance = await totalTokenBalance(solana);
    const [row] = await db
      .update(schema.users)
      .set({ tokenBalance: balance, tier: withOverride(tierForBalance(balance, (await getSettings()).thresholds), floor), tierCheckedAt: new Date() })
      .where(eq(schema.users.id, user.id))
      .returning();
    if (row!.tier !== user.tier) await syncInviteSeats(row!);
    return row!;
  } catch {
    // RPC hiccup: keep the last known tier rather than downgrading anyone (a Founder / gift / grant floor still applies).
    const floored = withOverride(user.tier, floor);
    if (floored === user.tier) return user;
    const [row] = await db.update(schema.users).set({ tier: floored }).where(eq(schema.users.id, user.id)).returning();
    await syncInviteSeats(row!);
    return row!;
  }
}

/**
 * Members who hold any of these Solana addresses (linked by signature or as a
 * sign-in wallet): their tier is recomputed now, so a wallet grant added or
 * removed in /admin applies at once instead of at the next 5-minute check.
 */
export async function refreshTiersForWallets(addresses: string[]) {
  if (addresses.length === 0) return;
  const linked = await db.selectDistinct({ userId: schema.wallets.userId }).from(schema.wallets).where(inArray(schema.wallets.address, addresses));
  const users = await db
    .select()
    .from(schema.users)
    .where(or(arrayOverlaps(schema.users.wallets, addresses), linked.length ? inArray(schema.users.id, linked.map((l) => l.userId)) : undefined));
  for (const user of users) await refreshTier(user, true);
}

/** Invite seats follow the tier; never below the seats already used. */
async function syncInviteSeats(user: UserRow) {
  await db
    .update(schema.inviteCodes)
    .set({ maxUses: sql`greatest(${schema.inviteCodes.uses}, ${TIER_LIMITS[user.tier].invites})` })
    .where(eq(schema.inviteCodes.ownerId, user.id));
}

export async function toMe(user: UserRow): Promise<Me> {
  const [code] = await db
    .select()
    .from(schema.inviteCodes)
    .where(eq(schema.inviteCodes.ownerId, user.id))
    .limit(1);
  const [{ value: referrals } = { value: 0 }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(eq(schema.users.invitedById, user.id));
  return {
    id: user.id,
    username: user.username,
    xHandle: user.xHandle,
    wallets: user.wallets,
    tier: user.tier,
    tokenBalance: user.tokenBalance,
    referralCode: code?.code ?? "",
    invitesLeft: code ? Math.max(0, code.maxUses - code.uses) : 0,
    referrals,
    role: user.role,
    linkedWallets: await verifiedWallets(user),
  };
}

export async function isUsernameTaken(username: string) {
  const [row] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, username.toLowerCase()))
    .limit(1);
  return Boolean(row);
}

export const notOnboarded = (id: string) => and(eq(schema.users.id, id), isNull(schema.users.username));
