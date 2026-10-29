import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import sharp, { type OutputInfo } from "sharp";
import { count, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db";
import { env } from "../env";
import { requireUser } from "../lib/auth";
import { badRequest, forbidden, HttpError, notFound } from "../lib/errors";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_USER = 100;
// Decoding is memory hungry (25M px ≈ 100 MB of RGBA): a couple at a time keeps a small instance alive.
const MAX_PIXELS = 25_000_000;
const MAX_CONCURRENT_DECODES = 2;
let decoding = 0;

/** Output size per use: avatars are square, the rest keep their ratio. */
const presets = {
  avatar: { width: 512, height: 512, fit: "cover" as const },
  background: { width: 2400, height: 2400, fit: "inside" as const },
  widget: { width: 1200, height: 1200, fit: "inside" as const },
};

/** Sniffs the real format from the first bytes; the file name and Content-Type are never trusted. */
function sniff(buf: Buffer): "png" | "jpeg" | "webp" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

/**
 * Image uploads. Only PNG, JPEG and WebP up to 8 MB are accepted; every
 * file is decoded and re-encoded to WebP (strips metadata and anything
 * hidden in the original) before it is stored.
 */
export async function mediaRoutes(app: FastifyInstance) {
  await app.register(multipart, { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1, fields: 0 } });

  app.post("/me/media", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req) => {
    const user = await requireUser(req);
    // Members only: waitlist accounts have no profile to put images on.
    if (!user.username) throw forbidden("Claim a username first");
    const { kind } = z.object({ kind: z.enum(["avatar", "background", "widget"]) }).parse(req.query);

    const [{ value: used } = { value: 0 }] = await db.select({ value: count() }).from(schema.media).where(eq(schema.media.userId, user.id));
    if (used >= MAX_FILES_PER_USER) throw badRequest("Upload limit reached", "upload_limit");

    const file = await req.file();
    if (!file) throw badRequest("No file", "no_file");
    let input: Buffer;
    try {
      input = await file.toBuffer();
    } catch {
      throw badRequest("Images must be 8 MB or less", "too_large");
    }
    if (!sniff(input)) throw badRequest("Only PNG, JPG and WebP images", "bad_type");

    const p = presets[kind];
    if (decoding >= MAX_CONCURRENT_DECODES) throw new HttpError(503, "busy", "Too many uploads right now, try again in a few seconds");
    decoding++;
    let out: { data: Buffer; info: OutputInfo };
    try {
      out = await sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" })
        .rotate() // honour EXIF orientation before it is stripped
        .resize({ width: p.width, height: p.height, fit: p.fit, withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer({ resolveWithObject: true });
    } catch {
      throw badRequest("This image could not be read (max 25 megapixels)", "bad_image");
    } finally {
      decoding--;
    }

    const [row] = await db
      .insert(schema.media)
      .values({ userId: user.id, kind, mime: "image/webp", bytes: out.data, width: out.info.width, height: out.info.height })
      .returning({ id: schema.media.id });
    return { url: `${env.API_PUBLIC_URL}/media/${row!.id}.webp`, width: out.info.width, height: out.info.height };
  });

  app.get<{ Params: { file: string } }>("/media/:file", async (req, reply) => {
    const id = req.params.file.replace(/\.webp$/, "");
    if (!z.uuid().safeParse(id).success) throw notFound();
    const [row] = await db.select({ mime: schema.media.mime, bytes: schema.media.bytes }).from(schema.media).where(eq(schema.media.id, id)).limit(1);
    if (!row) throw notFound();
    return reply
      .header("content-type", row.mime)
      .header("cache-control", "public, max-age=31536000, immutable")
      // Served from the API host but shown on fl3x.lol.
      .header("cross-origin-resource-policy", "cross-origin")
      .send(row.bytes);
  });
}
