import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CHAINS, PERIODS } from "@fl3x/shared";
import { getCommunity } from "../lib/providers/community";
import { getToken } from "../lib/providers/dexscreener";
import { getMedia } from "../lib/providers/media";
import { getWallet } from "../lib/providers/wallet";
import { notFound } from "../lib/errors";

const httpUrl = z.url({ protocol: /^https?$/ });

/**
 * Public, cached proxies to third-party data used by widgets. API keys
 * never reach the browser; responses are cached in Postgres.
 */
export async function dataRoutes(app: FastifyInstance) {
  const opts = { config: { rateLimit: { max: 60, timeWindow: "1 minute" } } };

  app.get("/data/token", opts, async (req) => {
    const q = z
      .object({ chain: z.enum(CHAINS.map((c) => c.id) as [string, ...string[]]), address: z.string().regex(/^[A-Za-z0-9]{20,64}$/) })
      .parse(req.query);
    const token = await getToken(q.chain, q.address);
    if (!token) throw notFound("Token not found");
    return token;
  });

  app.get("/data/community", opts, async (req) => {
    const { url } = z.object({ url: httpUrl }).parse(req.query);
    const data = await getCommunity(url);
    if (!data) throw notFound("Unsupported or unknown community link");
    return data;
  });

  app.get("/data/media", opts, async (req) => {
    const { url } = z.object({ url: httpUrl }).parse(req.query);
    const data = await getMedia(url);
    if (!data) throw notFound("Unsupported media link");
    return data;
  });

  app.get("/data/wallet", opts, async (req) => {
    const q = z
      .object({
        address: z.string().regex(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/),
        period: z.enum(PERIODS.map((p) => p.id) as [string, ...string[]]).default("7d"),
      })
      .parse(req.query);
    return getWallet(q.address, q.period as (typeof PERIODS)[number]["id"]);
  });
}
