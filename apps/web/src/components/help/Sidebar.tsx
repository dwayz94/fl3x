"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { Home01Icon } from "@hugeicons/core-free-icons";
import { Icon, type AnyIcon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { HELP_GROUPS } from "./content";

function SidebarLink({ href, label, icon, active, onNavigate }: { href: string; label: string; icon: AnyIcon; active: boolean; onNavigate?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn("group relative flex h-9 items-center gap-2.5 rounded-xl px-3 text-sm transition-colors duration-200", active ? "text-fg" : "text-fg-2 hover:text-fg")}
    >
      {/* The highlight slides from the previous page to the new one. */}
      {active && <motion.span layoutId="help-sidebar-active" className="absolute inset-0 rounded-xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 500, damping: 40 }} />}
      <Icon icon={icon} size={18} className={cn("relative shrink-0 transition-colors duration-200", active ? "text-brand" : "text-fg-3 group-hover:text-fg")} />
      <span className="relative truncate">{label}</span>
    </Link>
  );
}

/** Grouped article list. Also used inside the mobile menu (onNavigate closes it). */
export function HelpSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Help Center" className="flex flex-col gap-6">
      <SidebarLink href="/help" label="Overview" icon={Home01Icon} active={pathname === "/help"} onNavigate={onNavigate} />
      {HELP_GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-0.5">
          <span className="px-3 pb-1.5 text-xs text-fg-3 uppercase">{group.title}</span>
          {group.pages.map((page) => (
            <SidebarLink
              key={page.slug}
              href={`/help/${page.slug}`}
              label={page.title}
              icon={page.icon}
              active={pathname === `/help/${page.slug}`}
              onNavigate={onNavigate}
            />
          ))}
        </div>
      ))}
    </nav>
  );
}
