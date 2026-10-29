import { timingSafeEqual } from "node:crypto";
import { env } from "../env";

/** True when the request carries the key shared with the web app's server (never sent to browsers). */
export function isInternalRequest(given: unknown) {
  if (typeof given !== "string" || !env.INTERNAL_API_KEY) return false;
  const a = Buffer.from(given);
  const b = Buffer.from(env.INTERNAL_API_KEY);
  return a.length === b.length && timingSafeEqual(a, b);
}
