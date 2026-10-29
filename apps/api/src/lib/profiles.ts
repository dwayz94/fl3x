import { and, asc, count, eq, isNotNull, lte } from "drizzle-orm";
import {
  DEFAULT_THEME, WIDGETS, ownedBadges,
  type EditableProfile, type LinkKind, type ProfileTheme, type Widget, type WidgetSize, type WidgetType,
} from "@fl3x/shared";
import { db, schema } from "../db";
import { thresholds } from "../env";
import type { UserRow } from "./users";

/** Numbers behind badges: referrals and onboarding order. */
export async function badgeStats(user: UserRow) {
  const [{ value: referrals } = { value: 0 }] = await db
    .select({ value: count() })
    .from(schema.users)
    .where(eq(schema.users.invitedById, user.id));
  let memberNumber: number | null = null;
  if (user.onboardedAt) {
    const [{ value } = { value: 0 }] = await db
      .select({ value: count() })
      .from(schema.users)
      .where(and(isNotNull(schema.users.onboardedAt), lte(schema.users.onboardedAt, user.onboardedAt)));
    memberNumber = value;
  }
  return { referrals, memberNumber };
}

export async function badgesFor(user: UserRow, stats?: Awaited<ReturnType<typeof badgeStats>>) {
  const { referrals, memberNumber } = stats ?? (await badgeStats(user));
  return ownedBadges({
    tier: user.tier,
    early: Boolean(user.invitedWithCode),
    memberNumber,
    referrals,
    tokenBalance: user.tokenBalance,
    premiumMin: thresholds.premium,
    staff: user.role === "admin",
    granted: user.grantedBadges,
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
