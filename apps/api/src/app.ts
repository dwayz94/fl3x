import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { env } from "./env";
import { HttpError } from "./lib/errors";
import helmet from "@fastify/helmet";
import { adminRoutes } from "./routes/admin";
import { analyticsRoutes } from "./routes/analytics";
import { connectionRoutes } from "./routes/connections";
import { dataRoutes } from "./routes/data";
import { devRoutes } from "./routes/dev";
import { editorRoutes } from "./routes/editor";
import { marketRoutes } from "./routes/markets";
import { mediaRoutes } from "./routes/media";
import { meRoutes } from "./routes/me";
import { isInternalRequest } from "./lib/internal";
import { captureError } from "./lib/monitoring";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { publicRoutes } from "./routes/public";
import { referralRoutes } from "./routes/referrals";
import { walletRoutes } from "./routes/wallets";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "production" ? true : { transport: undefined, level: "info" },
    trustProxy: true, // Render sits behind a proxy
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN.split(",").map((o) => o.trim()),
    // @fastify/cors only allows GET/HEAD/POST by default; the editor saves with PUT/PATCH/DELETE.
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
  });
  await app.register(helmet, { global: true });
  await app.register(rateLimit, {
    max: 120,
    timeWindow: "1 minute",
    // Render's edge (Cloudflare) sets the real client IP; X-Forwarded-For's first entry is client-controlled.
    keyGenerator: (req) => String(req.headers["cf-connecting-ip"] ?? req.headers["true-client-ip"] ?? req.ip),
    // Server-to-server calls from the web app (profile pages, analytics) all come from Vercel's shared IPs.
    allowList: (req) => isInternalRequest(req.headers["x-internal-key"]),
  });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: "validation_error", message: err.issues[0]?.message ?? "Invalid input" });
    }
    if (err instanceof HttpError) {
      return reply.status(err.status).send({ error: err.code, message: err.message });
    }
    // Postgres unique violation: two requests raced for the same username, wallet…
    const pg = (err as { code?: string; cause?: { code?: string } });
    if (pg.code === "23505" || pg.cause?.code === "23505") {
      return reply.status(409).send({ error: "conflict", message: "This is already taken, refresh and try again" });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.status(status).send({ error: "request_error", message: (err as Error).message });
    }
    req.log.error(err);
    captureError(err, { method: req.method, route: req.routeOptions.url });
    return reply.status(500).send({ error: "internal", message: "Something went wrong" });
  });

  /** Uptime checks (Render health check, external monitors): the API answers and the database too. */
  const started = Date.now();
  app.get("/health", { config: { rateLimit: false } }, async (_req, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { ok: true, db: true, uptimeSeconds: Math.round((Date.now() - started) / 1000) };
    } catch (err) {
      captureError(err, { check: "health" });
      return reply.status(503).send({ ok: false, db: false });
    }
  });

  await app.register(publicRoutes);
  await app.register(meRoutes);
  await app.register(referralRoutes);
  await app.register(editorRoutes);
  await app.register(analyticsRoutes);
  await app.register(dataRoutes);
  await app.register(mediaRoutes);
  await app.register(walletRoutes);
  await app.register(marketRoutes);
  await app.register(connectionRoutes);
  await app.register(adminRoutes);
  await app.register(devRoutes);
  return app;
}
