import { sql } from "drizzle-orm";
import {
  boolean, customType, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";

const bytea = customType<{ data: Buffer }>({ dataType: () => "bytea" });
import type { ProfileTheme, WidgetSettings } from "@fl3x/shared";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  privyId: text("privy_id").notNull().unique(),
  // Lowercased for uniqueness; display casing kept in profiles.displayName
  username: text("username").unique(),
  xHandle: text("x_handle"),
  xAvatarUrl: text("x_avatar_url"),
  wallets: text("wallets").array().notNull().default(sql`'{}'::text[]`),
  role: text("role", { enum: ["user", "admin"] }).notNull().default("user"),
  tier: text("tier", { enum: ["none", "starter", "premium"] }).notNull().default("none"),
  /** Tier given by the team from /admin (gift, partner): the member gets at least this, whatever they hold. */
  tierOverride: text("tier_override", { enum: ["starter", "premium"] }),
  tokenBalance: doublePrecision("token_balance").notNull().default(0),
  tierCheckedAt: timestamp("tier_checked_at", { withTimezone: true }),
  /** Badges handed out by the team (see BADGES with unlock "granted"). */
  grantedBadges: text("granted_badges").array().notNull().default(sql`'{}'::text[]`),
  invitedById: uuid("invited_by_id"),
  invitedWithCode: text("invited_with_code"),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("users_invited_by_idx").on(t.invitedById)]);

/** ownerId null = genesis code minted by the team. */
export const inviteCodes = pgTable("invite_codes", {
  code: text("code").primaryKey(),
  ownerId: uuid("owner_id").references(() => users.id, { onDelete: "cascade" }),
  maxUses: integer("max_uses").notNull(),
  uses: integer("uses").notNull().default(0),
  note: text("note"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("invite_codes_owner_idx").on(t.ownerId)]);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").unique(),
  xHandle: text("x_handle").unique(),
  desiredUsername: text("desired_username"),
  refCode: text("ref_code"),
  invitedAt: timestamp("invited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  theme: jsonb("theme").$type<Partial<ProfileTheme>>().notNull().default({}),
  badges: text("badges").array().notNull().default(sql`'{}'::text[]`),
  isPublished: boolean("is_published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  size: text("size").notNull(),
  position: integer("position").notNull().default(0),
  settings: jsonb("settings").$type<WidgetSettings>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("widgets_user_idx").on(t.userId, t.position)]);

export const links = pgTable("links", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  url: text("url").notNull(),
  label: text("label"),
  position: integer("position").notNull().default(0),
}, (t) => [index("links_user_idx").on(t.userId, t.position)]);

/** Profile analytics: one row per view or link click. */
export const profileEvents = pgTable("profile_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  profileUserId: uuid("profile_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["view", "click"] }).notNull(),
  target: text("target"),
  visitorHash: text("visitor_hash").notNull(),
  country: text("country"),
  device: text("device", { enum: ["desktop", "mobile", "tablet"] }).notNull(),
  referrer: text("referrer"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("profile_events_user_time_idx").on(t.profileUserId, t.createdAt),
  // Dedup lookups (one view per visitor and day) and the public view count.
  index("profile_events_user_visitor_idx").on(t.profileUserId, t.visitorHash),
  index("profile_events_user_kind_idx").on(t.profileUserId, t.kind),
]);

export const widgetReactions = pgTable("widget_reactions", {
  widgetId: uuid("widget_id").notNull().references(() => widgets.id, { onDelete: "cascade" }),
  emoji: text("emoji").notNull(),
  count: integer("count").notNull().default(0),
}, (t) => [primaryKey({ columns: [t.widgetId, t.emoji] })]);

/** Wallet USD value over time, used for P&L and portfolio charts. */
export const walletSnapshots = pgTable("wallet_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  wallet: text("wallet").notNull(),
  valueUsd: doublePrecision("value_usd").notNull(),
  takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("wallet_snapshots_wallet_time_idx").on(t.wallet, t.takenAt)]);

/** Postgres-backed cache for third-party API responses. */
export const dataCache = pgTable("data_cache", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/**
 * Wallets proven with a signature (our own connect flow, any chain). The
 * Solana wallet used to sign in through Privy lives in users.wallets.
 */
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  chain: text("chain", { enum: ["solana", "evm"] }).notNull(),
  /** Base58 for Solana, lowercase 0x hex for EVM. */
  address: text("address").notNull(),
  label: text("label"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [uniqueIndex("wallets_chain_address_idx").on(t.chain, t.address), index("wallets_user_idx").on(t.userId)]);

/** One-time messages to sign when linking a wallet. */
export const walletChallenges = pgTable("wallet_challenges", {
  nonce: text("nonce").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

/**
 * Uploads. Images are re-encoded to WebP (never served as uploaded); video
 * backgrounds (kind "video") are MP4 / WebM kept as uploaded once checked, or
 * animated WebP made from a GIF; "poster" is the still frame shown for them.
 */
export const media = pgTable("media", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind", { enum: ["avatar", "background", "widget", "video", "poster"] }).notNull(),
  mime: text("mime").notNull(),
  bytes: bytea("bytes").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  /** Videos and animations only. */
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("media_user_idx").on(t.userId)]);

/** Third-party accounts a member connected (Spotify now playing). Tokens are encrypted. */
export const connections = pgTable("connections", {
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider", { enum: ["spotify"] }).notNull(),
  accountName: text("account_name"),
  refreshToken: text("refresh_token").notNull(),
  accessToken: text("access_token"),
  expiresAt: timestamp("expires_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.userId, t.provider] })]);

/** Live site settings edited from /admin (launch phase, token mint, thresholds, banner): one JSON row, no restart needed. */
export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Tiers handed to Solana wallets from /admin (giveaways: "drop your address"),
 * even before anyone joined with them. A member whose tier-counting wallets
 * include one gets at least this tier (a floor, like users.tierOverride).
 */
export const walletGrants = pgTable("wallet_grants", {
  /** Base58 Solana address, as given (case matters). */
  address: text("address").primaryKey(),
  tier: text("tier", { enum: ["starter", "premium"] }).notNull().default("premium"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
