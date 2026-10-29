import { and, count, eq, isNull } from "drizzle-orm";
import { tierForBalance, type Me } from "@fl3x/shared";
import { db, schema } from "../db";
import { env, thresholds } from "../env";
import { devAuth, fetchIdentity } from "./privy";
import { totalTokenBalance } from "./solana";
import { verifiedWallets } from "./wallets";

export type UserRow = typeof schema.users.$inferSelect;

const TIER_TTL_MS = 10 * 60 * 1000;

/** Create or refresh the local user from Privy's linked accounts. */
export async function syncUser(privyId: string): Promise<UserRow> {
  const identity = await fetchIdentity(privyId);
  const [row] = await db
    .insert(schema.users)
    .values({ privyId, ...identity })
    .onConflictDoUpdate({ target: schema.users.privyId, set: identity })
    .returning();
  return refreshTier(row!, true);
}

export async function refreshTier(user: UserRow, force = false): Promise<UserRow> {
  const fresh = user.tierCheckedAt && Date.now() - user.tierCheckedAt.getTime() < TIER_TTL_MS;
  if (fresh && !force) return user;
  if (devAuth && env.DEV_TIER && user.privyId.startsWith("did:dev:")) {
    const [row] = await db.update(schema.users).set({ tier: env.DEV_TIER, tierCheckedAt: new Date() }).where(eq(schema.users.id, user.id)).returning();
    return row!;
  }
  try {
    const linked = await db.select({ address: schema.wallets.address }).from(schema.wallets).where(and(eq(schema.wallets.userId, user.id), eq(schema.wallets.chain, "solana")));
    const balance = await totalTokenBalance([...new Set([...user.wallets, ...linked.map((l) => l.address)])]);
    const [row] = await db
      .update(schema.users)
      .set({ tokenBalance: balance, tier: tierForBalance(balance, thresholds), tierCheckedAt: new Date() })
      .where(eq(schema.users.id, user.id))
      .returning();
    return row!;
  } catch {
    // RPC hiccup: keep the last known tier rather than downgrading anyone.
    return user;
  }
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
