import type { FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { db, schema } from "../db";
import { unauthorized } from "./errors";
import { verifyAccessToken } from "./privy";
import { syncUser, type UserRow } from "./users";

export async function requirePrivyId(req: FastifyRequest): Promise<string> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const privyId = token ? await verifyAccessToken(token) : null;
  if (!privyId) throw unauthorized();
  return privyId;
}

/** Loads the signed-in user, creating it from Privy on first sight. */
export async function requireUser(req: FastifyRequest): Promise<UserRow> {
  const privyId = await requirePrivyId(req);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.privyId, privyId)).limit(1);
  return user ?? syncUser(privyId);
}
