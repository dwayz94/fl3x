"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowDown01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { HELP_PAGES } from "./content";
import { HelpSidebar } from "./Sidebar";

/** Below lg the sidebar folds into a menu at the top of the page. */
export function HelpMobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const current = HELP_PAGES.find((p) => pathname === `/help/${p.slug}`)?.title ?? "Overview";

  return (
    <div className="rounded-2xl bg-surface lg:hidden">
      <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="flex h-12 w-full items-center gap-3 px-4 text-left text-sm">
        <Icon icon={Menu01Icon} size={18} className="text-fg-3" />
        <span className="min-w-0 flex-1 truncate">{current}</span>
        <Icon icon={ArrowDown01Icon} size={18} className={cn("text-fg-3 transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open && (
        <div className="border-t border-white/10 px-1 py-4">
          <HelpSidebar onNavigate={() => setOpen(false)} />
        </div>
      )}
    </div>
  );
}
