import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { onNetwork } from "@fl3x/shared";
import { db, schema } from "../db";
import { requireUser } from "../lib/auth";
import { notFound } from "../lib/errors";
import { getHyperliquid } from "../lib/providers/hyperliquid";
import { getPolymarket } from "../lib/providers/polymarket";
import { getTrades } from "../lib/providers/trades";
import { resolveWidgetWallets, verifiedWallets } from "../lib/wallets";

/**
 * Trading widgets: recent Solana swaps, Hyperliquid perps, Polymarket positions.
 * Wallet-based ones follow the portfolio pattern: the editor asks for its own
 * verified wallets, public profiles ask by widget id so addresses never reach the page.
 */
export async function marketRoutes(app: FastifyInstance) {
  const perWidget = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };
  // Calls a third-party API on a miss: same per-IP limit as the scraping endpoints in data.ts.
  const scrape = { config: { rateLimit: { max: 30, timeWindow: "1 minute" } } };
  const ownWallets = z.object({ wallets: z.string().max(1000).default("all") });

  /** The widget's owner and settings, when the widget exists and has this type. */
  async function widgetWallets(widgetId: string, type: string) {
    if (!z.uuid().safeParse(widgetId).success) throw notFound();
    const [row] = await db
      .select({ widget: schema.widgets, user: schema.users })
      .from(schema.widgets)
      .innerJoin(schema.users, eq(schema.users.id, schema.widgets.userId))
      .where(eq(schema.widgets.id, widgetId))
      .limit(1);
    if (!row || row.widget.type !== type) throw notFound();
    return resolveWidgetWallets(row.widget.settings.wallets, await verifiedWallets(row.user));
  }

  app.get("/me/trades", async (req) => {
    const user = await requireUser(req);
    const q = ownWallets.parse(req.query);
    return getTrades(onNetwork(resolveWidgetWallets(q.wallets, await verifiedWallets(user)), "solana"));
  });

  app.get<{ Params: { widgetId: string } }>("/data/trades/:widgetId", perWidget, async (req) =>
    getTrades(onNetwork(await widgetWallets(req.params.widgetId, "trades"), "solana")),
  );

  app.get("/me/hyperliquid", async (req) => {
    const user = await requireUser(req);
    const q = ownWallets.parse(req.query);
    return getHyperliquid(onNetwork(resolveWidgetWallets(q.wallets, await verifiedWallets(user)), "evm"));
  });

  app.get<{ Params: { widgetId: string } }>("/data/hyperliquid/:widgetId", perWidget, async (req) =>
    getHyperliquid(onNetwork(await widgetWallets(req.params.widgetId, "hyperliquid"), "evm")),
  );

  /** Public Polymarket profile: an address (0x…), a polymarket.com profile URL or @username. */
  app.get("/data/polymarket", scrape, async (req) => {
    const q = z.object({ user: z.string().trim().min(1).max(200) }).parse(req.query);
    const data = await getPolymarket(q.user);
    if (!data) throw notFound("Polymarket profile not found");
    return data;
  });
}
