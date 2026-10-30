"use client";

import { motion } from "motion/react";

/** Light fade when switching between help articles. */
export function HelpFade({ id, className, children }: { id: string; className?: string; children: React.ReactNode }) {
  return (
    <motion.div key={id} className={className} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
