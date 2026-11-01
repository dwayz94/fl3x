import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db, schema } from "../db";
import { saveMedia } from "./storage";
import type { UserRow } from "./users";

/** X's image CDN: a hotlinked picture we haven't copied yet. */
const isXHosted = (url: string) => /^https:\/\/pbs\.twimg\.com\//.test(url);

/**
 * Gives a member their X profile picture: downloaded in 400×400 (X hands out a
 * 48 px "_normal" link), re-encoded to WebP and stored like an upload, so it
 * never breaks when X changes or blocks the link. Only while the member hasn't
 * picked their own avatar (none yet, or still X's link). Never throws.
 */
export async function adoptXAvatar(user: UserRow): Promise<void> {
  if (!user.xAvatarUrl || !user.username) return;
  try {
    const [profile] = await db.select({ avatarUrl: schema.profiles.avatarUrl }).from(schema.profiles).where(eq(schema.profiles.userId, user.id)).limit(1);
    if (!profile || (profile.avatarUrl && !isXHosted(profile.avatarUrl))) return;

    const large = user.xAvatarUrl.replace(/_normal(\.\w+)?$/, "_400x400$1");
    let res = await fetch(large, { signal: AbortSignal.timeout(8000) });
    if (!res.ok && large !== user.xAvatarUrl) res = await fetch(user.xAvatarUrl, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return;
    const out = await sharp(Buffer.from(await res.arrayBuffer()), { limitInputPixels: 25_000_000 })
      .resize({ width: 400, height: 400, fit: "cover" })
      .webp({ quality: 85 })
      .toBuffer({ resolveWithObject: true });

    const saved = await saveMedia({ userId: user.id, kind: "avatar", mime: "image/webp", bytes: out.data, width: out.info.width, height: out.info.height });
    await db.update(schema.profiles).set({ avatarUrl: saved.url }).where(eq(schema.profiles.userId, user.id));
  } catch {
    // X unreachable or an odd image: the profile keeps what it had.
  }
}
