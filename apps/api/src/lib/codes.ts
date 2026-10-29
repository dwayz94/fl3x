import { randomBytes } from "node:crypto";

// No 0/O/1/I to keep codes readable when shared out loud.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** XXXX-XXXX: 8 random characters (32^8 ≈ 10^12 codes). Older codes (FL3X-XXXXXX) still work. */
export function generateCode() {
  const bytes = randomBytes(8);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${out.slice(0, 4)}-${out.slice(4)}`;
}
