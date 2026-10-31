import type { FastifyInstance } from "fastify";
import { and, arrayContains, eq, ne } from "drizzle-orm";
import { z } from "zod";
import { onNetwork, PERIODS, PORTFOLIO_WIDGET_TYPES, widgetWallets, type PeriodId, type WidgetType } from "@fl3x/shared";
import { db, schema } from "../db";
import { requireUser } from "../lib/auth";
import { badRequest, conflict, notFound } from "../lib/errors";
import { getNfts } from "../lib/providers/nfts";
import { getPortfolio } from "../lib/providers/wallet";
import { refreshTier, toMe } from "../lib/users";
import {
  chainOf, consumeChallenge, challengeMessage, createChallenge, normalizeAddress, resolveWidgetWallets, verifiedWallets, verifyWalletSignature,
} from "../lib/wallets";

const MAX_WALLETS = 10;
const period = z.enum(PERIODS.map((p) => p.id) as [PeriodId, ...PeriodId[]]).default("7d");
const address = z.string().trim().min(32).max(64);

/**
 * Wallet linking with our own flow: the browser asks the wallet extension
 * to sign a one-time message, the API checks the signature. No transaction,
 * no third-party connect kit.
 */
export async function walletRoutes(app: FastifyInstance) {
  const strict = { config: { rateLimit: { max: 20, timeWindow: "1 minute" } } };

  app.post("/me/wallets/challenge", strict, async (req) => {
    const user = await requireUser(req);
    const body = z.object({ address }).parse(req.body);
    const chain = chainOf(body.address);
    if (!chain) throw badRequest("Unknown wallet address format", "bad_address");
    return createChallenge(user.id, normalizeAddress(chain, body.address));
  });

  app.post("/me/wallets", strict, async (req) => {
    const user = await requireUser(req);
    const body = z.object({ address, nonce: z.string().length(32), signature: z.string().min(40).max(200) }).parse(req.body);
    const chain = chainOf(body.address);
    if (!chain) throw badRequest("Unknown wallet address format", "bad_address");
    const addr = normalizeAddress(chain, body.address);

    const mine = await verifiedWallets(user);
    if (mine.some((w) => w.address.toLowerCase() === addr.toLowerCase())) throw conflict("This wallet is already linked", "already_linked");
    if (mine.length >= MAX_WALLETS) throw badRequest(`You can link up to ${MAX_WALLETS} wallets`, "wallet_limit");

    const expiresAt = await consumeChallenge(user.id, body.nonce);
    if (!expiresAt) throw badRequest("This signature request expired, try again", "challenge_expired");
    // Personal sign messages are checked against the original casing for EVM checksums too.
    const ok = await verifyWalletSignature(chain, body.address, challengeMessage(addr, body.nonce, expiresAt), body.signature);
    if (!ok) throw badRequest("The signature doesn't match this wallet", "bad_signature");

    const [taken] = await db.select().from(schema.wallets).where(and(eq(schema.wallets.chain, chain), eq(schema.wallets.address, addr))).limit(1);
    // Also someone else's sign-in wallet: the same tokens must not give two accounts a tier.
    const [login] = taken ? [] : await db.select({ id: schema.users.id }).from(schema.users).where(and(arrayContains(schema.users.wallets, [body.address]), ne(schema.users.id, user.id))).limit(1);
    if (taken || login) throw conflict("This wallet is linked to another FL3X account", "wallet_taken");
    await db.insert(schema.wallets).values({ userId: user.id, chain, address: addr });
    return toMe(await refreshTier(user, true));
  });

  app.delete<{ Params: { id: string } }>("/me/wallets/:id", async (req) => {
    const user = await requireUser(req);
    if (!z.uuid().safeParse(req.params.id).success) throw notFound("Wallet not found");
    const [row] = await db.delete(schema.wallets).where(and(eq(schema.wallets.id, req.params.id), eq(schema.wallets.userId, user.id))).returning();
    if (!row) throw notFound("Wallet not found");
    return toMe(await refreshTier(user, true));
  });

  /** NFT gallery, editor preview: own verified wallets only. */
  app.get("/me/nfts", async (req) => {
    const user = await requireUser(req);
    const q = z.object({ wallets: z.string().max(1000).default("all") }).parse(req.query);
    return getNfts(resolveWidgetWallets(q.wallets, await verifiedWallets(user)));
  });

  /** NFT gallery on a public profile: resolved from the widget id, like the portfolio. */
  app.get<{ Params: { widgetId: string } }>("/data/nfts/:widgetId", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (req) => {
    if (!z.uuid().safeParse(req.params.widgetId).success) throw notFound();
    const [row] = await db
      .select({ widget: schema.widgets, user: schema.users })
      .from(schema.widgets)
      .innerJoin(schema.users, eq(schema.users.id, schema.widgets.userId))
      .where(eq(schema.widgets.id, req.params.widgetId))
      .limit(1);
    if (!row || row.widget.type !== "nfts") throw notFound();
    return getNfts(resolveWidgetWallets(row.widget.settings.wallets, await verifiedWallets(row.user)));
  });

  /** Editor preview: own verified wallets only. */
  app.get("/me/portfolio", async (req) => {
    const user = await requireUser(req);
    const q = z.object({ wallets: z.string().max(1000).default("all"), period, network: z.enum(["solana", "evm"]).optional() }).parse(req.query);
    return getPortfolio(onNetwork(resolveWidgetWallets(q.wallets, await verifiedWallets(user)), q.network), q.period);
  });

  /**
   * Public: value behind a profile's wallet widget. Resolved from the widget
   * id so wallet addresses never appear in the profile page.
   */
  app.get<{ Params: { widgetId: string } }>("/data/portfolio/:widgetId", { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } }, async (req) => {
    if (!z.uuid().safeParse(req.params.widgetId).success) throw notFound();
    const q = z.object({ period }).parse(req.query);
    const [row] = await db
      .select({ widget: schema.widgets, user: schema.users })
      .from(schema.widgets)
      .innerJoin(schema.users, eq(schema.users.id, schema.widgets.userId))
      .where(eq(schema.widgets.id, req.params.widgetId))
      .limit(1);
    if (!row || !(PORTFOLIO_WIDGET_TYPES as readonly string[]).includes(row.widget.type)) throw notFound();
    // Same wallets as the editor shows: its pick, limited to its network (older P&L cards without one default to Solana).
    const mine = (await verifiedWallets(row.user)).map((v) => v.address);
    return getPortfolio(widgetWallets(row.widget.type as WidgetType, row.widget.settings, mine) ?? [], q.period);
  });
}
