import { eq } from "drizzle-orm";
import { normalizeUsername } from "@fl3x/shared";
import { db, schema } from "../db";

/**
 * Referral links carry the member's handle (fl3x.lol/invite/alice); older
 * links carry the code itself (FL3X-ABC123). Returns the invite code either way.
 */
export async function resolveInviteCode(input: string): Promise<string | null> {
  const raw = input.trim().replace(/^@/, "");
  if (!raw) return null;
  const [byCode] = await db.select({ code: schema.inviteCodes.code }).from(schema.inviteCodes).where(eq(schema.inviteCodes.code, raw.toUpperCase())).limit(1);
  if (byCode) return byCode.code;
  const [byOwner] = await db
    .select({ code: schema.inviteCodes.code })
    .from(schema.inviteCodes)
    .innerJoin(schema.users, eq(schema.users.id, schema.inviteCodes.ownerId))
    .where(eq(schema.users.username, normalizeUsername(raw)))
    .limit(1);
  return byOwner?.code ?? null;
}
