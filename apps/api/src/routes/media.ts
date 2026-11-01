import type { FastifyInstance } from "fastify";
import multipart from "@fastify/multipart";
import sharp, { type OutputInfo } from "sharp";
import { and, count, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { MAX_BACKGROUND_VIDEO_BYTES, MAX_BACKGROUND_VIDEO_SECONDS } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { requireUser } from "../lib/auth";
import { badRequest, forbidden, HttpError, notFound } from "../lib/errors";
import { refreshTier } from "../lib/users";
import { readVideo, sniffVideo, VideoError } from "../lib/video";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_USER = 100;
/** Videos weigh up to 20 MB each in Postgres: old ones beyond this have to go before new ones come in. */
const MAX_VIDEOS_PER_USER = 10;
/** Encoders round: a "30 s" export often lasts 30.02 s. */
const DURATION_SLACK_MS = 250;
// Decoding is memory hungry (25M px ≈ 100 MB of RGBA): a couple at a time keeps a small instance alive.
const MAX_PIXELS = 25_000_000;
/** Animated GIFs: sharp sees all frames as one tall strip. 400M px ≈ 30 s of 480p at 25 fps. */
const MAX_FRAMES = 1500;
const MAX_ANIMATION_PIXELS = 400_000_000;
const MAX_CONCURRENT_DECODES = 2;
let decoding = 0;

/** Output size per use: avatars are square, the rest keep their ratio. */
const presets = {
  avatar: { width: 512, height: 512, fit: "cover" as const },
  background: { width: 2400, height: 2400, fit: "inside" as const },
  widget: { width: 1200, height: 1200, fit: "inside" as const },
};

/** Sniffs the real format from the first bytes; the file name and Content-Type are never trusted. */
function sniff(buf: Buffer): "png" | "jpeg" | "webp" | "gif" | null {
  if (buf.length < 12) return null;
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") return "png";
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpeg";
  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buf.toString("ascii", 0, 6) === "GIF87a" || buf.toString("ascii", 0, 6) === "GIF89a") return "gif";
  return null;
}

const tooLong = (what: "Videos" | "GIFs", ms: number) =>
  badRequest(`${what} must be ${MAX_BACKGROUND_VIDEO_SECONDS} seconds or less (this one is ${Math.round(ms / 1000)} s)`, "too_long");

/** One decode slot (sharp is memory hungry), released when `fn` ends. */
async function decode<T>(fn: () => Promise<T>): Promise<T> {
  if (decoding >= MAX_CONCURRENT_DECODES) throw new HttpError(503, "busy", "Too many uploads right now, try again in a few seconds");
  decoding++;
  try {
    return await fn();
  } finally {
    decoding--;
  }
}

/** Re-encodes a still image to WebP, at most `p`'s size. */
function stillWebp(input: Buffer, p: (typeof presets)[keyof typeof presets]) {
  return sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" })
    .rotate() // honour EXIF orientation before it is stripped
    .resize({ width: p.width, height: p.height, fit: p.fit, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });
}

/**
 * Uploads. Images: PNG, JPEG and WebP up to 8 MB, decoded and re-encoded to
 * WebP (strips metadata and anything hidden in the original). Video
 * backgrounds (Premium): MP4 (H.264) or WebM up to 20 MB and 30 s, stored as
 * uploaded once checked; animated GIF / WebP become animated WebP.
 */
export async function mediaRoutes(app: FastifyInstance) {
  // A video and its still frame (poster) in one request.
  await app.register(multipart, { limits: { fileSize: MAX_BACKGROUND_VIDEO_BYTES, files: 2, fields: 0 } });

  app.post("/me/media", { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } }, async (req) => {
    let user = await requireUser(req);
    // Members only: waitlist accounts have no profile to put images on.
    if (!user.username) throw forbidden("Claim a username first");
    const { kind } = z.object({ kind: z.enum(["avatar", "background", "widget", "video"]) }).parse(req.query);
    if (kind === "video") {
      user = await refreshTier(user);
      if (user.tier !== "premium") throw forbidden("Video backgrounds are Premium");
    }

    const [{ value: used } = { value: 0 }] = await db.select({ value: count() }).from(schema.media).where(eq(schema.media.userId, user.id));
    if (used >= MAX_FILES_PER_USER) throw badRequest("Upload limit reached", "upload_limit");

    // "file", plus "poster" for videos (a frame the browser grabbed: we can't decode video here).
    const parts: Record<string, Buffer> = {};
    for await (const part of req.files()) {
      try {
        parts[part.fieldname] = await part.toBuffer();
      } catch {
        throw badRequest(kind === "video" ? "Videos must be 20 MB or less" : "Images must be 8 MB or less", "too_large");
      }
    }
    const input = parts.file;
    if (!input) throw badRequest("No file", "no_file");
    if (kind !== "video") {
      if (input.length > MAX_UPLOAD_BYTES) throw badRequest("Images must be 8 MB or less", "too_large");
      const type = sniff(input);
      if (!type || type === "gif") throw badRequest("Only PNG, JPG and WebP images", "bad_type");
      let out: { data: Buffer; info: OutputInfo };
      try {
        out = await decode(() => stillWebp(input, presets[kind]));
      } catch (err) {
        if (err instanceof HttpError) throw err;
        throw badRequest("This image could not be read (max 25 megapixels)", "bad_image");
      }
      const [row] = await db
        .insert(schema.media)
        .values({ userId: user.id, kind, mime: "image/webp", bytes: out.data, width: out.info.width, height: out.info.height })
        .returning({ id: schema.media.id });
      return { url: `${env.API_PUBLIC_URL}/media/${row!.id}.webp`, width: out.info.width, height: out.info.height };
    }

    const [{ value: videos } = { value: 0 }] = await db
      .select({ value: count() })
      .from(schema.media)
      .where(and(eq(schema.media.userId, user.id), eq(schema.media.kind, "video")));
    if (videos >= MAX_VIDEOS_PER_USER) throw badRequest("Video upload limit reached", "upload_limit");

    const maxMs = MAX_BACKGROUND_VIDEO_SECONDS * 1000 + DURATION_SLACK_MS;
    const format = sniffVideo(input);
    const image = format ? null : sniff(input);
    let stored: { bytes: Buffer; mime: string; ext: string; width: number; height: number; durationMs: number };
    let poster: Buffer | null = null;
    let posterInfo: OutputInfo | null = null;

    if (format) {
      let info;
      try {
        info = readVideo(input, format); // also blanks MP4 metadata boxes (location…) in place
      } catch (err) {
        if (err instanceof VideoError) throw badRequest(err.message, err.code);
        throw err;
      }
      if (info.durationMs > maxMs) throw tooLong("Videos", info.durationMs);
      stored = { bytes: input, mime: `video/${format}`, ext: format, width: info.width, height: info.height, durationMs: Math.round(info.durationMs) };
      // The browser's frame is an ordinary image: same checks and re-encoding as any upload.
      if (parts.poster && parts.poster.length <= MAX_UPLOAD_BYTES && sniff(parts.poster) && sniff(parts.poster) !== "gif") {
        try {
          const out = await decode(() => stillWebp(parts.poster!, presets.background));
          poster = out.data;
          posterInfo = out.info;
        } catch (err) {
          if (err instanceof HttpError) throw err; // busy
          // An unreadable poster is not worth failing the upload: the video shows on a dark base until it plays.
        }
      }
    } else if (image === "gif" || image === "webp") {
      // Animated GIF (or WebP): duration from the frame delays, stored as animated WebP (a fraction of the GIF).
      let meta;
      try {
        meta = await sharp(input, { animated: true }).metadata();
      } catch {
        throw badRequest("This GIF could not be read", "bad_image");
      }
      const frames = meta.pages ?? 1;
      const frameHeight = meta.pageHeight ?? meta.height ?? 0;
      if (frames < 2) throw badRequest("This image doesn't move: use it as an image background instead", "not_animated");
      const framePixels = (meta.width ?? 0) * frameHeight;
      if (framePixels > MAX_PIXELS || frames > MAX_FRAMES || framePixels * frames > MAX_ANIMATION_PIXELS) {
        throw badRequest("This GIF has too many frames or is too large", "bad_image");
      }
      // Browsers play GIF frames of 10 ms or less at 100 ms.
      const durationMs = (meta.delay ?? []).reduce((sum, d) => sum + (image === "gif" && d <= 10 ? 100 : d), 0);
      if (durationMs > maxMs) throw tooLong("GIFs", durationMs);
      try {
        const [anim, still] = await decode(() =>
          Promise.all([
            sharp(input, { animated: true, limitInputPixels: MAX_ANIMATION_PIXELS, failOn: "error" })
              .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
              .webp({ quality: 75, effort: 4 })
              .toBuffer({ resolveWithObject: true }),
            stillWebp(input, presets.background), // first frame
          ]),
        );
        stored = { bytes: anim.data, mime: "image/webp", ext: "webp", width: anim.info.width, height: anim.info.pageHeight ?? anim.info.height, durationMs };
        poster = still.data;
        posterInfo = still.info;
      } catch (err) {
        if (err instanceof HttpError) throw err;
        throw badRequest("This GIF could not be read", "bad_image");
      }
    } else {
      throw badRequest("Only MP4, WebM and GIF files", "bad_type");
    }

    const [row] = await db
      .insert(schema.media)
      .values({ userId: user.id, kind: "video", mime: stored.mime, bytes: stored.bytes, width: stored.width, height: stored.height, durationMs: stored.durationMs })
      .returning({ id: schema.media.id });
    let posterUrl: string | null = null;
    if (poster && posterInfo) {
      const [p] = await db
        .insert(schema.media)
        .values({ userId: user.id, kind: "poster", mime: "image/webp", bytes: poster, width: posterInfo.width, height: posterInfo.height })
        .returning({ id: schema.media.id });
      posterUrl = `${env.API_PUBLIC_URL}/media/${p!.id}.webp`;
    }
    return {
      url: `${env.API_PUBLIC_URL}/media/${row!.id}.${stored.ext}`,
      poster: posterUrl,
      width: stored.width,
      height: stored.height,
      durationMs: stored.durationMs,
    };
  });

  // Higher limit than the API default: a video plays through a series of Range requests.
  app.get<{ Params: { file: string } }>("/media/:file", { config: { rateLimit: { max: 600, timeWindow: "1 minute" } } }, async (req, reply) => {
    const id = req.params.file.replace(/\.(webp|mp4|webm)$/, "");
    if (!z.uuid().safeParse(id).success) throw notFound();
    const where = eq(schema.media.id, id);
    const [meta] = await db.select({ mime: schema.media.mime, size: sql<number>`octet_length(${schema.media.bytes})` }).from(schema.media).where(where).limit(1);
    if (!meta) throw notFound();
    const size = Number(meta.size);
    reply
      .header("content-type", meta.mime)
      .header("cache-control", "public, max-age=31536000, immutable")
      .header("accept-ranges", "bytes")
      .header("etag", `"${id}"`) // files never change: the id is the version
      // Served from the API host but shown on fl3x.lol.
      .header("cross-origin-resource-policy", "cross-origin");

    // Safari only plays a video when the server answers byte ranges (206); other browsers use them to seek.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range && (range[1] || range[2])) {
      let start: number;
      let end: number;
      if (range[1]) {
        start = Number(range[1]);
        end = range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      } else {
        start = Math.max(0, size - Number(range[2])); // "bytes=-500": the last 500 bytes
        end = size - 1;
      }
      if (start >= size || start > end) return reply.status(416).header("content-range", `bytes */${size}`).send();
      // At most 2 MB per answer: "bytes=0-" would otherwise load the whole video into memory for each viewer.
      // Browsers ask for the next slice on their own.
      end = Math.min(end, start + 2 * 1024 * 1024 - 1);
      // Only the asked slice leaves Postgres (substring is 1-based).
      const [part] = await db
        .select({ bytes: sql<Uint8Array>`substring(${schema.media.bytes} from ${start + 1} for ${end - start + 1})` })
        .from(schema.media)
        .where(where);
      const bytes = Buffer.from(part!.bytes.buffer, part!.bytes.byteOffset, part!.bytes.byteLength);
      return reply.status(206).header("content-range", `bytes ${start}-${end}/${size}`).send(bytes);
    }
    const [row] = await db.select({ bytes: schema.media.bytes }).from(schema.media).where(where).limit(1);
    return reply.send(row!.bytes);
  });
}
