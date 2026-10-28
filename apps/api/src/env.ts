import { z } from "zod";
import { LAUNCH_PHASES } from "@fl3x/shared";

const schema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().optional().transform((v) => v || undefined),
  PRIVY_APP_ID: z.string().default(""),
  PRIVY_APP_SECRET: z.string().default(""),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  LAUNCH_PHASE: z.enum(LAUNCH_PHASES).default("invite_only"),
  SOLANA_RPC_URL: z.string().url().default("https://api.mainnet-beta.solana.com"),
  // Optional: higher Jupiter price API limits (portal.jup.ag)
  JUPITER_API_KEY: z.string().default(""),
  TOKEN_SYMBOL: z.string().default("FL3X"),
  TOKEN_MINT: z.string().optional().transform((v) => v || null),
  TIER_STARTER_MIN: z.coerce.number().default(100_000),
  TIER_PREMIUM_MIN: z.coerce.number().default(1_000_000),
  DEFAULT_INVITE_QUOTA: z.coerce.number().int().default(3),
  ADMIN_API_KEY: z.string().default(""),
  // Dev login only (no Privy configured): wallet given to every dev user
  DEV_WALLET: z.string().default(""),
  // Shared with the web app's /api/track route (forwards visitor geo from Vercel)
  INTERNAL_API_KEY: z.string().default("dev-internal-key"),
  // Salt for hashing visitor IPs in analytics
  ANALYTICS_SALT: z.string().default("dev-salt"),
  // Optional: live status for Twitch widgets
  TWITCH_CLIENT_ID: z.string().default(""),
  TWITCH_CLIENT_SECRET: z.string().default(""),
});

export const env = schema.parse(process.env);

if (env.NODE_ENV === "production") {
  for (const key of ["DATABASE_URL", "PRIVY_APP_ID", "PRIVY_APP_SECRET", "ADMIN_API_KEY", "INTERNAL_API_KEY", "ANALYTICS_SALT"] as const) {
    if (!env[key]) throw new Error(`Missing required env var ${key}`);
  }
}

export const thresholds = { starter: env.TIER_STARTER_MIN, premium: env.TIER_PREMIUM_MIN };
