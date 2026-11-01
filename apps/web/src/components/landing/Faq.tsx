"use client";

import { useState } from "react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * One answer open at a time; it unfolds (height + fade) instead of jumping
 * open. CSS only (a grid row from 0fr to 1fr): no animation library on the landing.
 */
export function Faq({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="flex flex-col gap-3">
      {items.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className={cn("overflow-hidden rounded-2xl transition-colors duration-300", isOpen ? "bg-[#202020]" : "bg-surface hover:bg-[#1d1d1d]")}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-4 p-4 pl-6 text-left"
            >
              <span className="font-primary text-2xl">{f.q}</span>
              <span className={cn("shrink-0 transition-transform duration-300", EASE, isOpen ? "rotate-45 text-brand" : "text-fg-2")}>
                <Icon icon={Add01Icon} />
              </span>
            </button>
            <div className={cn("grid transition-[grid-template-rows,opacity] duration-[350ms]", EASE, isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
              <div className="overflow-hidden" aria-hidden={!isOpen}>
                <p className={cn("px-6 pb-5 text-sm leading-relaxed text-fg-2 transition-transform duration-[350ms]", EASE, isOpen ? "translate-y-0" : "-translate-y-1.5")}>{f.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
