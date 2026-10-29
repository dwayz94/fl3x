"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Add01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

const EASE = [0.22, 1, 0.36, 1] as const;

/** One answer open at a time; it unfolds (height + fade) instead of jumping open. */
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
              <motion.span animate={{ rotate: isOpen ? 45 : 0 }} transition={{ duration: 0.3, ease: EASE }} className={cn("shrink-0", isOpen ? "text-brand" : "text-fg-2")}>
                <Icon icon={Add01Icon} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="answer"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ height: { duration: 0.35, ease: EASE }, opacity: { duration: 0.25 } }}
                >
                  <motion.p initial={{ y: -6 }} animate={{ y: 0 }} exit={{ y: -6 }} transition={{ duration: 0.35, ease: EASE }} className="px-6 pb-5 text-sm leading-relaxed text-fg-2">
                    {f.a}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
