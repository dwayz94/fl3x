import type { FastifyInstance } from "fastify";
import { and, eq, sql } from "drizzle-orm";
import { normalizeUsername, validateUsername, waitlistRequest, type PublicConfig, type PublicProfile } from "@fl3x/shared";
import { db, schema } from "../db";
import { env, thresholds } from "../env";
import { notFound } from "../lib/errors";
import { isUsernameTaken } from "../lib/users";

export async function publicRoutes(app: FastifyInstance) {
  app.get("/health", async () => ({ ok: true }));

  app.get("/config", async (): Promise<PublicConfig> => ({
    phase: env.LAUNCH_PHASE,
    token: { symbol: env.TOKEN_SYMBOL, mint: env.TOKEN_MINT },
    thresholds,
  }));

  app.get<{ Params: { username: string } }>("/usernames/:username", async (req) => {
    const check = validateUsername(req.params.username);
    if (!check.valid) return { available: false, reason: check.message };
    const taken = await isUsernameTaken(normalizeUsername(req.params.username));
    return { available: !taken, reason: taken ? "This username is already taken" : null };
  });

  app.get<{ Params: { code: string } }>("/invites/:code", async (req) => {
    const code = req.params.code.trim().toUpperCase();
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

  app.post("/waitlist", { config: { rateLimit: { max: 5, timeWindow: "1 minute" } } }, async (req) => {
    const body = waitlistRequest.parse(req.body);
    const xHandle = body.xHandle?.replace(/^@/, "").toLowerCase();
    await db
      .insert(schema.waitlist)
      .values({
        email: body.email?.toLowerCase(),
        xHandle,
        desiredUsername: body.desiredUsername && normalizeUsername(body.desiredUsername),
        refCode: body.ref,
      })
      .onConflictDoNothing();
    const [{ total } = { total: 0 }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.waitlist);
    return { ok: true, total };
  });

  app.get<{ Params: { username: string } }>("/profiles/:username", async (req): Promise<PublicProfile> => {
    const [row] = await db
      .select({ user: schema.users, profile: schema.profiles })
      .from(schema.users)
      .innerJoin(schema.profiles, eq(schema.profiles.userId, schema.users.id))
      .where(and(eq(schema.users.username, normalizeUsername(req.params.username)), eq(schema.profiles.isPublished, true)))
      .limit(1);
    if (!row) throw notFound("Profile not found");
    return {
      username: row.user.username!,
      displayName: row.profile.displayName,
      bio: row.profile.bio,
      avatarUrl: row.profile.avatarUrl ?? row.user.xAvatarUrl,
      tier: row.user.tier,
      xHandle: row.user.xHandle,
    };
  });
}
