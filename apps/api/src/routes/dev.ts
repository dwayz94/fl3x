import type { FastifyInstance } from "fastify";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { BADGES, defaultSettings, type WidgetSettings, type WidgetType, TIER_LIMITS, PORTFOLIO_WIDGET_TYPES } from "@fl3x/shared";
import { db, schema } from "../db";
import { env } from "../env";
import { generateCode } from "../lib/codes";
import { devAuth } from "../lib/privy";
import { syncUser } from "../lib/users";

/**
 * Local-only test sessions (registered only when the dev login is active,
 * never in production). "member" is a fully set-up profile to explore the
 * dashboard; "fresh" is a brand new account that goes through /join.
 */
export async function devRoutes(app: FastifyInstance) {
  if (!devAuth) return;

  app.post("/dev/session", async (req) => {
    const { kind } = z.object({ kind: z.enum(["member", "fresh"]) }).parse(req.body);
    if (kind === "fresh") {
      const name = `new_${Math.random().toString(36).slice(2, 8)}`;
      await syncUser(`did:dev:${name}`);
      return { token: `dev:${name}` };
    }
    await seedMember("tester");
    return { token: "dev:tester" };
  });
}

const web = env.WEB_ORIGIN.split(",")[0]!.trim();

const SAMPLE_WIDGETS: { type: WidgetType; size: "large" | "long"; settings: WidgetSettings }[] = [
  { type: "pnl", size: "large", settings: { period: "1m" } },
  { type: "community", size: "long", settings: { platform: "telegram", invite: "durov" } },
  { type: "community", size: "long", settings: { platform: "discord", invite: "solana" } },
  { type: "token", size: "large", settings: { chain: "solana", address: "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263", note: "The dog of Solana. Never selling." } },
  { type: "portfolio", size: "long", settings: { period: "7d" } },
  { type: "followers", size: "long", settings: { platform: "x", handle: "solana" } },
  { type: "clock", size: "large", settings: { timezone: "Asia/Dubai", city: "Dubai", country: "AE" } },
  { type: "link", size: "large", settings: { image: `${web}/images/creators/bi0.jpg`, title: "My trading course", body: "Everything I learned in 4 years of memecoins, in 12 videos.", ctaLabel: "Get it", url: "https://fl3x.lol" } },
  { type: "video", size: "long", settings: { platform: "youtube", channel: "MrBeast" } },
  { type: "music", size: "long", settings: { source: "link", url: "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT" } },
  { type: "holdings", size: "large", settings: {} },
  { type: "countdown", size: "large", settings: { title: "FL3X launch", target: "2026-12-01T18:00:00.000Z", country: "AE", ctaLabel: "Coming soon", ctaUrl: "https://fl3x.lol" } },
];

/** Idempotent: the member keeps whatever was edited in the dashboard since the first seed. */
async function seedMember(name: string) {
  const user = await syncUser(`did:dev:${name}`);
  if (user.username) return;

  const wallet = user.wallets[0];
  await db.transaction(async (tx) => {
    await tx.update(schema.users).set({ username: name, onboardedAt: new Date() }).where(eq(schema.users.id, user.id));
    await tx.insert(schema.profiles).values({
      userId: user.id,
      displayName: "Tester",
      bio: "FL3X on all screens!",
      avatarUrl: `${web}/images/creators/solamies.jpg`,
      badges: BADGES.map((b) => b.id),
      theme: { accent: "#FF97CB", background: "image", backgroundUrl: `${web}/images/backgrounds/sign-bg.png`, font: "moga", cursor: "default" },
    });
    await tx.insert(schema.widgets).values(
      SAMPLE_WIDGETS
        // Wallet widgets need a verified wallet: skipped when DEV_WALLET is empty.
        .filter((w) => wallet || !(PORTFOLIO_WIDGET_TYPES as readonly string[]).includes(w.type))
        .map((w, position) => ({
          userId: user.id,
          type: w.type,
          size: w.size,
          position,
          settings: { ...defaultSettings(w.type), ...w.settings },
        })),
    );
    await tx.insert(schema.links).values([
      { userId: user.id, kind: "x", url: "https://x.com/fl3xdotlol", position: 0 },
      { userId: user.id, kind: "discord", url: "https://discord.gg/solana", position: 1 },
      { userId: user.id, kind: "telegram", url: "https://t.me/durov", position: 2 },
      { userId: user.id, kind: "website", url: "https://fl3x.lol", label: "fl3x.lol", position: 3 },
    ]);
    await tx.insert(schema.inviteCodes).values({ code: generateCode(), ownerId: user.id, maxUses: TIER_LIMITS.none.invites });

    // Two weeks of local analytics so the charts have something to show.
    const countries = ["FR", "US", "AE", "GB", "DE", "CA", "NG", "BR"];
    const devices = ["mobile", "mobile", "desktop", "tablet"] as const;
    const referrers = ["x.com", "t.me", "discord.com", null];
    const events: (typeof schema.profileEvents.$inferInsert)[] = [];
    for (let d = 13; d >= 0; d--) {
      const perDay = 20 + Math.round(Math.sin(d / 2) * 8 + (13 - d) * 3);
      for (let i = 0; i < perDay; i++) {
        const at = new Date(Date.now() - d * 86_400_000 - Math.random() * 86_400_000);
        const click = Math.random() < 0.25;
        events.push({
          profileUserId: user.id,
          kind: click ? "click" : "view",
          target: click ? (Math.random() < 0.5 ? "x" : "website") : null,
          visitorHash: `seed-${d}-${i % 17}`,
          country: countries[i % countries.length],
          device: devices[i % devices.length]!,
          referrer: referrers[i % referrers.length],
          createdAt: at,
        });
      }
    }
    await tx.insert(schema.profileEvents).values(events);
  });
}
