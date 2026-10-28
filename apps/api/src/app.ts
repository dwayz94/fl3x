import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { ZodError } from "zod";
import { env } from "./env";
import { HttpError } from "./lib/errors";
import { adminRoutes } from "./routes/admin";
import { meRoutes } from "./routes/me";
import { publicRoutes } from "./routes/public";

export async function buildApp() {
  const app = Fastify({
    logger: env.NODE_ENV === "production" ? true : { transport: undefined, level: "info" },
    trustProxy: true, // Render sits behind a proxy
  });

  await app.register(cors, {
    origin: env.WEB_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  });
  await app.register(rateLimit, { max: 120, timeWindow: "1 minute" });

  app.setErrorHandler((err, req, reply) => {
    if (err instanceof ZodError) {
      return reply.status(400).send({ error: "validation_error", message: err.issues[0]?.message ?? "Invalid input" });
    }
    if (err instanceof HttpError) {
      return reply.status(err.status).send({ error: err.code, message: err.message });
    }
    const status = (err as { statusCode?: number }).statusCode;
    if (status && status < 500) {
      return reply.status(status).send({ error: "request_error", message: (err as Error).message });
    }
    req.log.error(err);
    return reply.status(500).send({ error: "internal", message: "Something went wrong" });
  });

  await app.register(publicRoutes);
  await app.register(meRoutes);
  await app.register(adminRoutes);
  return app;
}
