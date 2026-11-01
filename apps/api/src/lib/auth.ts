import type { FastifyRequest } from "fastify";
import { and, eq, isNotNull } from "drizzle-orm";
import { db, schema } from "../db";
import { unauthorized } from "./errors";
import { verifyAccessToken } from "./privy";
import { readTeamSession } from "./secrets";
import { syncUser, type UserRow } from "./users";

export async function requirePrivyId(req: FastifyRequest): Promise<string> {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const privyId = token ? ((token.startsWith("team.") ? await teamPrivyId(token) : null) ?? (await verifyAccessToken(token))) : null;
  if (!privyId) throw unauthorized();
  return privyId;
}

/** A team session (from /admin) only opens a reserved profile nobody has taken over yet. */
async function teamPrivyId(token: string): Promise<string | null> {
  const userId = readTeamSession(token);
  if (!userId) return null;
  const [row] = await db
    .select({ privyId: schema.users.privyId })
    .from(schema.users)
    .where(and(eq(schema.users.id, userId), isNotNull(schema.users.reservedFor)))
    .limit(1);
  return row?.privyId ?? null;
}

/** Loads the signed-in user, creating it from Privy on first sight. */
export async function requireUser(req: FastifyRequest): Promise<UserRow> {
  const privyId = await requirePrivyId(req);
  const [user] = await db.select().from(schema.users).where(eq(schema.users.privyId, privyId)).limit(1);
  return user ?? syncUser(privyId);
}
