import type { FastifyInstance } from "fastify";
import { and, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import type { ReferralSummary } from "@fl3x/shared";
import { db, schema } from "../db";
import { requireUser } from "../lib/auth";

const LEADERBOARD_SIZE = 20;

export async function referralRoutes(app: FastifyInstance) {
  /** Your referral stats, the people you brought, and the leaderboard. */
  app.get("/me/referrals", async (req): Promise<ReferralSummary> => {
    const user = await requireUser(req);
    const u = schema.users;
    const p = schema.profiles;
    const inviter = sql`${u.invitedById}`;

    // Referrals per member, highest first (ties: earliest member first).
    const counts = db
      .select({ id: sql<string>`${inviter}`.as("inviter_id"), n: count().as("n") })
      .from(u)
      .where(isNotNull(u.invitedById))
      .groupBy(inviter)
      .as("counts");

    const [leaders, [{ members } = { members: 0 }], [code], invited] = await Promise.all([
      db
        .select({ username: u.username, displayName: p.displayName, avatarUrl: p.avatarUrl, tier: u.tier, referrals: counts.n })
        .from(counts)
        .innerJoin(u, eq(u.id, counts.id))
        .leftJoin(p, eq(p.userId, u.id))
        .orderBy(desc(counts.n), u.onboardedAt)
        .limit(LEADERBOARD_SIZE),
      db.select({ members: count() }).from(u).where(isNotNull(u.onboardedAt)),
      db.select().from(schema.inviteCodes).where(eq(schema.inviteCodes.ownerId, user.id)).limit(1),
      db
        .select({ username: u.username, displayName: p.displayName, avatarUrl: p.avatarUrl, joinedAt: u.onboardedAt })
        .from(u)
        .leftJoin(p, eq(p.userId, u.id))
        .where(and(eq(u.invitedById, user.id), isNotNull(u.username)))
        .orderBy(desc(u.onboardedAt))
        .limit(50),
    ]);

    const mine = invited.length;
    // Rank: 1 + members with more referrals than you.
    const [{ ahead } = { ahead: 0 }] = await db.select({ ahead: count() }).from(counts).where(sql`${counts.n} > ${mine}`);
    // The smallest count above yours: how many more to climb one step.
    const [above] = await db.select({ n: counts.n }).from(counts).where(sql`${counts.n} > ${mine}`).orderBy(counts.n).limit(1);

    return {
      username: user.username!,
      code: code?.code ?? null,
      invitesLeft: code ? Math.max(0, code.maxUses - code.uses) : 0,
      referrals: mine,
      rank: ahead + 1,
      members,
      toNextRank: above ? above.n - mine + 1 : 0,
      nextRank: above ? ahead : null,
      invited: invited.map((i) => ({ username: i.username!, displayName: i.displayName, avatarUrl: i.avatarUrl, joinedAt: i.joinedAt?.toISOString() ?? null })),
      leaderboard: leaders.map((l, i) => ({
        rank: i + 1,
        username: l.username!,
        displayName: l.displayName,
        avatarUrl: l.avatarUrl,
        premium: l.tier === "premium",
        referrals: l.referrals,
        you: l.username === user.username,
      })),
    };
  });
}
