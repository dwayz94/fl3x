import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "../env";

const key = createHash("sha256").update(`enc:${env.CONNECTIONS_SECRET}`).digest();

/** AES-256-GCM for third-party tokens at rest. Output: iv.tag.ciphertext (base64url). */
export function encrypt(plain: string) {
  const iv = randomBytes(12);
  const c = createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.concat([c.update(plain, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}

export function decrypt(box: string) {
  const [iv, tag, data] = box.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = createDecipheriv("aes-256-gcm", key, iv!);
  d.setAuthTag(tag!);
  return Buffer.concat([d.update(data!), d.final()]).toString("utf8");
}

const mac = (payload: string) => createHmac("sha256", `state:${env.CONNECTIONS_SECRET}`).update(payload).digest("base64url");

/** Signed, expiring OAuth `state` so the callback knows which member started it. */
export function signState(data: Record<string, unknown>, ttlMs = 10 * 60 * 1000) {
  const payload = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + ttlMs })).toString("base64url");
  return `${payload}.${mac(payload)}`;
}

export function readState<T>(state: string): T | null {
  const [payload, sig] = state.split(".");
  if (!payload || !sig) return null;
  const expected = Buffer.from(mac(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  const data = JSON.parse(Buffer.from(payload, "base64url").toString()) as T & { exp: number };
  return data.exp > Date.now() ? data : null;
}

const teamMac = (payload: string) => createHmac("sha256", `team:${env.CONNECTIONS_SECRET}`).update(payload).digest("base64url");

/**
 * Session the team uses to build a reserved profile from /admin ("team.<userId>.<exp>.<sig>").
 * Its own key, so neither an OAuth state nor a preview code can stand in for it.
 */
export function signTeamSession(userId: string, ttlMs = 12 * 60 * 60 * 1000) {
  const payload = `${userId}.${Date.now() + ttlMs}`;
  return `team.${payload}.${teamMac(payload)}`;
}

/** The user id behind a valid, unexpired team session, or null. */
export function readTeamSession(token: string): string | null {
  const [prefix, userId, exp, sig] = token.split(".");
  if (prefix !== "team" || !userId || !exp || !sig) return null;
  const expected = Buffer.from(teamMac(`${userId}.${exp}`));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  return Number(exp) > Date.now() ? userId : null;
}

/** Code in the private link to a reserved profile (/@name?preview=…), so it can be shown before it's claimed. */
export function previewCode(username: string) {
  return createHmac("sha256", `preview:${env.CONNECTIONS_SECRET}`).update(username).digest("base64url").slice(0, 16);
}

export function isPreviewCode(username: string, given: unknown) {
  if (typeof given !== "string") return false;
  const a = Buffer.from(previewCode(username));
  const b = Buffer.from(given);
  return a.length === b.length && timingSafeEqual(a, b);
}
