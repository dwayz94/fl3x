import type { FastifyInstance } from "fastify";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { db, schema } from "../db";
import { env } from "../env";
import { generateCode } from "../lib/codes";
import { forbidden } from "../lib/errors";

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

export async function adminRoutes(app: FastifyInstance) {
  app.addHook("onRequest", async (req) => {
    if (!isAdminKey(req.headers["x-admin-key"])) throw forbidden();
  });

  /** Mint genesis invite codes (no owner). */
  app.post("/admin/invites", async (req) => {
    const { count, maxUses, note } = createInvites.parse(req.body ?? {});
    const rows = Array.from({ length: count }, () => ({ code: generateCode(), maxUses, note }));
    const created = await db.insert(schema.inviteCodes).values(rows).returning();
    return { codes: created.map((c) => c.code) };
  });
}
