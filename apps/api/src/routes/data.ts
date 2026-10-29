import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { CHAINS } from "@fl3x/shared";
import { getCommunity } from "../lib/providers/community";
import { getToken } from "../lib/providers/dexscreener";
import { getChannel, getMedia, getPreview } from "../lib/providers/media";
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

  /** 30 s audio preview of a track, fetched when a visitor presses play on a music widget. */
  app.get("/data/preview", opts, async (req) => {
    const q = z.object({ title: z.string().min(1).max(200), artist: z.string().min(1).max(200) }).parse(req.query);
    return getPreview(q.title, q.artist);
  });

  app.get("/data/channel", opts, async (req) => {
    const q = z.object({ platform: z.enum(["youtube", "twitch"]), handle: z.string().regex(/^[A-Za-z0-9._-]{2,30}$/) }).parse(req.query);
    const data = await getChannel(q.platform, q.handle);
    if (!data) throw notFound("Channel not found");
    return data;
  });
}
