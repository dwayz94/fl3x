import { randomUUID } from "node:crypto";
import { AwsClient } from "aws4fetch";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { env } from "../env";

/**
 * Where uploads live. With the R2 settings, files go to Cloudflare R2 and are
 * served from its custom domain (MEDIA_PUBLIC_URL: CDN, free bandwidth).
 * Without them (local dev), they stay in Postgres and the API serves them
 * from /media/<id>.<ext>, which also redirects files already moved to R2.
 */
const r2 =
  env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET && env.MEDIA_PUBLIC_URL
    ? new AwsClient({ accessKeyId: env.R2_ACCESS_KEY_ID, secretAccessKey: env.R2_SECRET_ACCESS_KEY, service: "s3", region: "auto" })
    : null;
const bucketUrl = `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${env.R2_BUCKET}`;
const publicBase = env.MEDIA_PUBLIC_URL.replace(/\/+$/, "");

export const extOf = (mime: string) => (mime === "video/mp4" ? "mp4" : mime === "video/webm" ? "webm" : "webp");

export function mediaUrl(id: string, mime: string, stored: "db" | "r2") {
  return stored === "r2" ? `${publicBase}/${id}.${extOf(mime)}` : `${env.API_PUBLIC_URL}/media/${id}.${extOf(mime)}`;
}

async function putObject(key: string, body: Buffer, contentType: string) {
  const res = await r2!.fetch(`${bucketUrl}/${key}`, {
    method: "PUT",
    body: new Uint8Array(body),
    // Ids never change once written: browsers and the CDN keep them for a year.
    headers: { "content-type": contentType, "cache-control": "public, max-age=31536000, immutable" },
  });
  if (!res.ok) throw new Error(`R2 upload failed: ${res.status}`);
}

type NewMedia = Omit<typeof schema.media.$inferInsert, "id" | "bytes" | "stored" | "createdAt"> & { bytes: Buffer };

/** Stores an upload (already checked and re-encoded) and returns its public URL. */
export async function saveMedia(file: NewMedia): Promise<{ id: string; url: string }> {
  const id = randomUUID();
  if (r2) {
    try {
      await putObject(`${id}.${extOf(file.mime)}`, file.bytes, file.mime);
      await db.insert(schema.media).values({ ...file, id, bytes: null, stored: "r2" });
      return { id, url: mediaUrl(id, file.mime, "r2") };
    } catch (err) {
      // R2 down or misconfigured (keys, permissions): the upload still works, kept in Postgres until it can move.
      console.error(`media ${id}: ${(err as Error).message}, kept in Postgres`);
    }
  }
  await db.insert(schema.media).values({ ...file, id, stored: "db" });
  return { id, url: mediaUrl(id, file.mime, "db") };
}

/** The id behind one of our own upload URLs (served by the API or from R2), else null. */
export function mediaIdOf(url: string | undefined): string | null {
  if (!url) return null;
  for (const base of [`${env.API_PUBLIC_URL}/media/`, ...(publicBase ? [`${publicBase}/`] : [])]) {
    if (!url.startsWith(base)) continue;
    const id = /^([0-9a-f-]{36})\.(webp|mp4|webm)$/i.exec(url.slice(base.length))?.[1];
    if (id) return id.toLowerCase();
  }
  return null;
}

export const r2Enabled = () => Boolean(r2);

/**
 * Moves files still in Postgres to R2, a batch at a time (from /admin). When
 * none are left, profile and widget URLs are rewritten to the R2 domain; the
 * old /media/ URLs keep working through the API's redirect anyway.
 */
export async function moveMediaToR2(batch: number): Promise<{ moved: number; left: number; urlsRewritten: boolean }> {
  if (!r2) throw new Error("R2 isn't configured");
  const rows = await db.select().from(schema.media).where(and(eq(schema.media.stored, "db"), isNotNull(schema.media.bytes))).limit(batch);
  for (const row of rows) {
    await putObject(`${row.id}.${extOf(row.mime)}`, Buffer.from(row.bytes!), row.mime);
    await db.update(schema.media).set({ stored: "r2", bytes: null }).where(eq(schema.media.id, row.id));
  }
  const [{ left } = { left: 0 }] = await db.select({ left: sql<number>`count(*)::int` }).from(schema.media).where(eq(schema.media.stored, "db"));
  if (left > 0) return { moved: rows.length, left, urlsRewritten: false };
  const from = `${env.API_PUBLIC_URL}/media/`;
  const to = `${publicBase}/`;
  await db.execute(sql`update profiles set avatar_url = replace(avatar_url, ${from}, ${to}) where avatar_url like ${from + "%"}`);
  await db.execute(sql`update profiles set theme = replace(theme::text, ${from}, ${to})::jsonb where theme::text like ${"%" + from + "%"}`);
  await db.execute(sql`update widgets set settings = replace(settings::text, ${from}, ${to})::jsonb where settings::text like ${"%" + from + "%"}`);
  return { moved: rows.length, left: 0, urlsRewritten: true };
}
