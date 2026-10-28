import { sql } from "drizzle-orm";
import {
  boolean, doublePrecision, index, integer, jsonb, pgTable, text, timestamp, uuid,
} from "drizzle-orm/pg-core";

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
  theme: jsonb("theme").$type<Record<string, unknown>>().notNull().default({}),
  isPublished: boolean("is_published").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const widgets = pgTable("widgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  size: text("size").notNull(),
  position: integer("position").notNull().default(0),
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [index("widgets_user_idx").on(t.userId, t.position)]);
