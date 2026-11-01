import { createPublicKey, randomBytes, verify } from "node:crypto";
import bs58 from "bs58";
import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { getAddress, isAddress, verifyMessage } from "viem";
import { PORTFOLIO_WIDGET_TYPES, type LinkedWallet, type WalletChain } from "@fl3x/shared";
import { db, schema } from "../db";
import type { UserRow } from "./users";

export const isSolanaAddress = (a: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(a);
export const isEvmAddress = (a: string) => isAddress(a, { strict: false });
export const chainOf = (a: string): WalletChain | null => (isEvmAddress(a) ? "evm" : isSolanaAddress(a) ? "solana" : null);
export const normalizeAddress = (chain: WalletChain, a: string) => (chain === "evm" ? a.toLowerCase() : a);

/**
 * Every wallet the user proved they own: the Solana wallet used to sign in
 * through Privy, plus wallets linked with a signature in Settings.
 */
export async function verifiedWallets(user: UserRow): Promise<LinkedWallet[]> {
  const rows = await db.select().from(schema.wallets).where(eq(schema.wallets.userId, user.id));
  const linked = rows.map((r) => ({ id: r.id, chain: r.chain, address: r.address, label: r.label, source: "signature" as const }));
  // A sign-in wallet another account linked by signature belongs to that account (widgets and tier alike).
  const claimed = user.wallets.length
    ? new Set((await db.select({ address: schema.wallets.address }).from(schema.wallets).where(and(inArray(schema.wallets.address, user.wallets), ne(schema.wallets.userId, user.id), eq(schema.wallets.signed, true)))).map((r) => r.address))
    : new Set<string>();
  const login = user.wallets
    .filter((a) => !linked.some((l) => l.address === a) && !claimed.has(a))
    .map((address) => ({ id: `login:${address}`, chain: "solana" as const, address, label: null, source: "login" as const }));
  return [...login, ...linked];
}

/** Widget setting "all" or "addr1,addr2" → the addresses to show, limited to verified ones. */
export function resolveWidgetWallets(setting: unknown, verified: LinkedWallet[]): string[] {
  const all = verified.map((w) => w.address);
  if (setting === undefined || setting === "" || setting === "all") return all;
  if (typeof setting !== "string") return [];
  const wanted = new Set(setting.split(",").map((a) => a.trim().toLowerCase()));
  return all.filter((a) => wanted.has(a.toLowerCase()));
}

const CHALLENGE_TTL_MS = 10 * 60 * 1000;

/** The exact text the wallet signs. Rebuilt on verify, so nothing in it can be swapped. */
export function challengeMessage(address: string, nonce: string, expiresAt: Date) {
  return [
    "FL3X wants to check that you own this wallet.",
    "",
    `Wallet: ${address}`,
    `Nonce: ${nonce}`,
    `Expires: ${expiresAt.toISOString()}`,
    "",
    "Signing is free. It does not send a transaction and gives FL3X no access to your funds.",
  ].join("\n");
}

export async function createChallenge(userId: string, address: string) {
  const nonce = randomBytes(16).toString("hex");
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  // Old challenges of this user are useless once a new one is asked for.
  await db.delete(schema.walletChallenges).where(and(eq(schema.walletChallenges.userId, userId), lt(schema.walletChallenges.expiresAt, new Date())));
  await db.insert(schema.walletChallenges).values({ nonce, userId, expiresAt });
  return { nonce, message: challengeMessage(address, nonce, expiresAt) };
}

/** Consumes the challenge (single use) and returns its expiry, or null if unknown/expired. */
export async function consumeChallenge(userId: string, nonce: string): Promise<Date | null> {
  const [row] = await db
    .delete(schema.walletChallenges)
    .where(and(eq(schema.walletChallenges.nonce, nonce), eq(schema.walletChallenges.userId, userId), gt(schema.walletChallenges.expiresAt, new Date())))
    .returning();
  return row?.expiresAt ?? null;
}

// DER prefix of an Ed25519 SubjectPublicKeyInfo; the raw 32-byte key follows.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/** Checks a personal_sign (EVM) or signMessage (Solana, base58 or base64 signature). */
export async function verifyWalletSignature(chain: WalletChain, address: string, message: string, signature: string): Promise<boolean> {
  try {
    if (chain === "evm") {
      return await verifyMessage({ address: getAddress(address), message, signature: signature as `0x${string}` });
    }
    const pub = Buffer.from(bs58.decode(address));
    if (pub.length !== 32) return false;
    const sig = /^[1-9A-HJ-NP-Za-km-z]+$/.test(signature) && signature.length > 80 ? Buffer.from(bs58.decode(signature)) : Buffer.from(signature, "base64");
    if (sig.length !== 64) return false;
    const key = createPublicKey({ key: Buffer.concat([ED25519_SPKI_PREFIX, pub]), format: "der", type: "spki" });
    return verify(null, Buffer.from(message, "utf8"), key, sig);
  } catch {
    return false;
  }
}

/** Users who show at least one wallet widget: their wallets get hourly snapshots. */
export async function walletsToSnapshot(): Promise<string[]> {
  const owners = await db
    .selectDistinct({ userId: schema.widgets.userId })
    .from(schema.widgets)
    .where(inArray(schema.widgets.type, [...PORTFOLIO_WIDGET_TYPES]));
  if (owners.length === 0) return [];
  const ids = owners.map((o) => o.userId);
  const [users, linked] = await Promise.all([
    db.select({ wallets: schema.users.wallets }).from(schema.users).where(inArray(schema.users.id, ids)),
    db.select({ address: schema.wallets.address }).from(schema.wallets).where(inArray(schema.wallets.userId, ids)),
  ]);
  return [...new Set([...users.flatMap((u) => u.wallets), ...linked.map((l) => l.address)])];
}
