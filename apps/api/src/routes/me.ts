import type { FastifyInstance } from "fastify";
import { and, eq, gt, isNull, lt, lte, or, sql } from "drizzle-orm";
import { claimRequest, normalizeUsername, waitlistRequest, type WaitlistStatus } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { requirePrivyId, requireUser } from "../lib/auth";
import { generateCode } from "../lib/codes";
import { badRequest, conflict, forbidden } from "../lib/errors";
import { isUsernameTaken, notOnboarded, refreshTier, syncUser, toMe } from "../lib/users";

export async function meRoutes(app: FastifyInstance) {
  /** Called by the web app right after a Privy login / account link. */
  app.post("/session", async (req) => toMe(await syncUser(await requirePrivyId(req))));

  app.get("/me", async (req) => toMe(await refreshTier(await requireUser(req))));

  app.post("/me/refresh-tier", { config: { rateLimit: { max: 6, timeWindow: "1 minute" } } }, async (req) =>
    toMe(await refreshTier(await requireUser(req), true)),
  );

  app.get("/me/waitlist", async (req) => waitlistStatus((await requireUser(req)).xHandle));

  /** Join the waitlist with the signed-in X account: no form, the handle comes from Privy. */
  app.post("/me/waitlist", { config: { rateLimit: { max: 10, timeWindow: "1 minute" } } }, async (req) => {
    const user = await requireUser(req);
    if (!user.xHandle) throw badRequest("Sign in with X to join the waitlist", "x_required");
    const body = waitlistRequest.parse(req.body ?? {});
    await db
      .insert(schema.waitlist)
      .values({
        xHandle: user.xHandle.toLowerCase(),
        desiredUsername: body.desiredUsername && normalizeUsername(body.desiredUsername),
        refCode: body.ref,
      })
      .onConflictDoNothing();
    return waitlistStatus(user.xHandle);
  });

  /**
   * Claim a username and join. During invite_only an invite code is
   * mandatory; the code's owner becomes the referrer.
   */
  app.post("/onboarding/claim", async (req) => {
    const user = await requireUser(req);
    if (user.username) throw conflict("You already claimed a username", "already_onboarded");
    const { username: raw, inviteCode } = claimRequest.parse(req.body);
    const username = normalizeUsername(raw);
    if (env.LAUNCH_PHASE === "invite_only" && !inviteCode) throw forbidden("An invite code is required during pre-launch");
    if (await isUsernameTaken(username)) throw conflict("This username is already taken", "username_taken");

    const updated = await db.transaction(async (tx) => {
      let inviterId: string | null = null;
      if (inviteCode) {
        // Atomic seat reservation: fails if the code is used up or expired.
        const [code] = await tx
          .update(schema.inviteCodes)
          .set({ uses: sql`${schema.inviteCodes.uses} + 1` })
          .where(and(
            eq(schema.inviteCodes.code, inviteCode),
            lt(schema.inviteCodes.uses, schema.inviteCodes.maxUses),
            or(isNull(schema.inviteCodes.expiresAt), gt(schema.inviteCodes.expiresAt, new Date())),
          ))
          .returning();
        if (!code) throw badRequest("This invite code is invalid or fully used", "invalid_invite");
        if (code.ownerId === user.id) throw badRequest("You cannot use your own invite code", "invalid_invite");
        inviterId = code.ownerId;
      }

      const [row] = await tx
        .update(schema.users)
        .set({ username, invitedById: inviterId, invitedWithCode: inviteCode ?? null, onboardedAt: new Date() })
        .where(notOnboarded(user.id))
        .returning();
      if (!row) throw conflict("You already claimed a username", "already_onboarded");

      await tx.insert(schema.profiles).values({ userId: user.id, displayName: raw, avatarUrl: user.xAvatarUrl });
      await tx.insert(schema.inviteCodes).values({
        code: generateCode(),
        ownerId: user.id,
        maxUses: env.DEFAULT_INVITE_QUOTA,
      });
      return row;
    });

    return toMe(updated);
  });
}

async function waitlistStatus(xHandle: string | null): Promise<WaitlistStatus> {
  const [{ total } = { total: 0 }] = await db.select({ total: sql<number>`count(*)::int` }).from(schema.waitlist);
  const [entry] = xHandle
    ? await db.select({ createdAt: schema.waitlist.createdAt }).from(schema.waitlist).where(eq(schema.waitlist.xHandle, xHandle.toLowerCase())).limit(1)
    : [];
  if (!entry) return { joined: false, xHandle, position: null, total };
  const [{ position } = { position: total }] = await db
    .select({ position: sql<number>`count(*)::int` })
    .from(schema.waitlist)
    .where(lte(schema.waitlist.createdAt, entry.createdAt));
  return { joined: true, xHandle, position, total };
}
