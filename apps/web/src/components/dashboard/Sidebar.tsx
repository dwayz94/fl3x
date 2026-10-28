"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Analytics02Icon, Award01Icon, CheckmarkBadge01Icon, Crown02Icon, Link01Icon, PaintBoardIcon, Settings02Icon,
} from "@hugeicons/core-free-icons";
import type { Me } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/dashboard/customize", label: "Customize", icon: PaintBoardIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: Analytics02Icon },
  { href: "/dashboard/badges", label: "Badges", icon: Award01Icon },
  { href: "/dashboard/links", label: "Links", icon: Link01Icon },
  { href: "/dashboard/premium", label: "Premium", icon: Crown02Icon },
];

const SETTINGS = { href: "/dashboard/settings", label: "Settings", icon: Settings02Icon };

function NavItem({ item, compact, active }: { item: (typeof NAV)[number]; compact: boolean; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn(
        "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
        active ? "bg-white/10 text-fg" : "text-fg-2 hover:bg-white/5 hover:text-fg",
        compact && "justify-center px-0",
      )}
    >
      <Icon icon={item.icon} size={18} className={active ? "text-brand" : undefined} />
      {!compact && item.label}
    </Link>
  );
}

export function Sidebar({ me, avatarUrl, compact }: { me: Me; avatarUrl: string | null; compact: boolean }) {
  const pathname = usePathname();
  return (
    <>
      <aside
        className={cn(
          "sticky top-0 hidden h-svh shrink-0 flex-col border-r border-white/10 bg-[#0b0b0b] py-6 md:flex",
          compact ? "w-[72px] px-3" : "w-[240px] px-4",
        )}
      >
        <Link href="/" className={cn("mb-6 flex h-10 items-center border-b border-white/10 pb-6", compact ? "justify-center" : "px-3")}>
          {compact ? (
            <Image src="/images/fl3x-icon.svg" alt="FL3X" width={24} height={26} />
          ) : (
            <Image src="/images/fl3x-logo.svg" alt="FL3X" width={78} height={26} />
          )}
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.href} item={item} compact={compact} active={pathname.startsWith(item.href)} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <NavItem item={SETTINGS} compact={compact} active={pathname.startsWith(SETTINGS.href)} />
          <Link
            href={`/@${me.username}`}
            target="_blank"
            className={cn("flex items-center gap-2.5 border-t border-white/10 pt-4", compact ? "justify-center" : "px-1")}
            title="View your profile"
          >
            <div className="size-9 shrink-0 overflow-hidden rounded-full bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {avatarUrl && <img src={avatarUrl} alt="" className="size-full object-cover" />}
            </div>
            {!compact && (
              <div className="min-w-0">
                <p className="flex items-center gap-1 truncate font-primary text-base leading-none">
                  {me.username}
                  {me.tier !== "none" && <Icon icon={CheckmarkBadge01Icon} size={14} className="text-verified" />}
                </p>
                <p className="truncate text-[11px] text-fg-3">fl3x.lol/@{me.username}</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Mobile: bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-white/10 bg-[#0b0b0b]/95 px-2 py-2 backdrop-blur md:hidden">
        {[...NAV, SETTINGS].map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link key={item.href} href={item.href} aria-label={item.label} className={cn("rounded-xl p-2.5", active ? "bg-white/10 text-brand" : "text-fg-2")}>
              <Icon icon={item.icon} size={20} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
