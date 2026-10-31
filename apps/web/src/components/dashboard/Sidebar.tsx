"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Analytics02Icon, Award01Icon, Crown02Icon, Link01Icon, PaintBoardIcon, Settings02Icon, UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import type { Me } from "@fl3x/shared";
import { Icon, Verified } from "@/components/ui";
import { cn } from "@/lib/cn";

export const NAV = [
  { href: "/dashboard/customize", label: "Customize", icon: PaintBoardIcon },
  { href: "/dashboard/analytics", label: "Analytics", icon: Analytics02Icon },
  { href: "/dashboard/badges", label: "Badges", icon: Award01Icon },
  { href: "/dashboard/links", label: "Links", icon: Link01Icon },
  { href: "/dashboard/referral", label: "Referral", icon: UserAdd01Icon },
  { href: "/dashboard/plan", label: "Plan", icon: Crown02Icon },
];

const SETTINGS = { href: "/dashboard/settings", label: "Settings", icon: Settings02Icon };

function NavItem({ item, active }: { item: (typeof NAV)[number]; active: boolean }) {
  return (
    <Link
      href={item.href}
      title={item.label}
      className={cn("relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors", active ? "text-fg" : "text-fg-2 hover:bg-white/5 hover:text-fg")}
    >
      {/* The highlight slides from one item to the next. */}
      {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-white/10" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
      <Icon icon={item.icon} size={18} className={cn("relative", active && "text-brand")} />
      <span className="relative">{item.label}</span>
    </Link>
  );
}

export function Sidebar({ me, avatarUrl }: { me: Me; avatarUrl: string | null }) {
  const pathname = usePathname();
  return (
    <>
      <aside className="sticky top-0 hidden h-svh w-[240px] shrink-0 flex-col border-r border-white/10 bg-[#0b0b0b] px-4 py-6 md:flex">
        <Link href="/" className="mb-6 flex h-10 items-center border-b border-white/10 px-3 pb-6">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={78} height={26} />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map((item) => (
            <NavItem key={item.href} item={item} active={pathname.startsWith(item.href)} />
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <NavItem item={SETTINGS} active={pathname.startsWith(SETTINGS.href)} />
          <Link
            href={`/@${me.username}`}
            target="_blank"
            className="flex items-center gap-2.5 border-t border-white/10 px-1 pt-4"
            title="View your profile"
          >
            <div className="size-9 shrink-0 overflow-hidden rounded-full bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {avatarUrl && <img src={avatarUrl} alt="" className="size-full object-cover" />}
            </div>
            <div className="min-w-0">
              <p className="flex items-center gap-1 truncate font-primary text-base leading-none">
                {me.username}
                {me.tier === "premium" && <Verified size={14} />}
              </p>
              <p className="truncate text-[11px] text-fg-3">fl3x.lol/@{me.username}</p>
            </div>
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
