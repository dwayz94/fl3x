import { asc, count, eq } from "drizzle-orm";
import {
  DEFAULT_THEME, WIDGETS, ownedBadges,
  type EditableProfile, type LinkKind, type ProfileTheme, type Widget, type WidgetSize, type WidgetType,
} from "@fl3x/shared";
import { db, schema } from "../db";
import type { UserRow } from "./users";

export async function badgesFor(user: UserRow) {
  const [{ value: referrals } = { value: 0 }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(eq(schema.users.invitedById, user.id));
  return ownedBadges({
    tier: user.tier,
    early: Boolean(user.invitedWithCode),
    referrals,
    hasX: Boolean(user.xHandle),
    staff: user.role === "admin",
  });
}

export async function loadProfile(user: UserRow): Promise<EditableProfile> {
  const [profile] = await db.select().from(schema.profiles).where(eq(schema.profiles.userId, user.id)).limit(1);
  const widgets = await db
    .select()
    .from(schema.widgets)
    .where(eq(schema.widgets.userId, user.id))
    .orderBy(asc(schema.widgets.position));
  const links = await db.select().from(schema.links).where(eq(schema.links.userId, user.id)).orderBy(asc(schema.links.position));

  return {
    username: user.username!,
    displayName: profile?.displayName ?? null,
    bio: profile?.bio ?? null,
    avatarUrl: profile?.avatarUrl ?? user.xAvatarUrl,
    badges: profile?.badges ?? [],
    theme: { ...DEFAULT_THEME, ...(profile?.theme as Partial<ProfileTheme>) },
    widgets: widgets
      .filter((w) => w.type in WIDGETS)
      .map((w): Widget => ({ id: w.id, type: w.type as WidgetType, size: w.size as WidgetSize, settings: w.settings })),
    links: links.map((l) => ({ id: l.id, kind: l.kind as LinkKind, url: l.url, label: l.label })),
  };
}
