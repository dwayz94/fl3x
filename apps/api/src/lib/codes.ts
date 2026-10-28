import { randomBytes } from "node:crypto";

// No 0/O/1/I to keep codes readable when shared out loud.
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateCode(prefix = "FL3X", length = 6) {
  const bytes = randomBytes(length);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${out}`;
}
