import { sql } from "drizzle-orm";
import {
  boolean, doublePrecision, index, integer, jsonb, pgTable, primaryKey, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
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
  tokenBalance: doublePrecision("token_balance").notNull().default(0),
  tierCheckedAt: timestamp("tier_checked_at", { withTimezone: true }),
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
}, (t) => [index("profile_events_user_time_idx").on(t.profileUserId, t.createdAt)]);

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
