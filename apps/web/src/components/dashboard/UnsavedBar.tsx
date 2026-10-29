"use client";

import { AnimatePresence, motion } from "motion/react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";

export /** Bottom bar while there are unsaved changes: discard or save. Shakes when you try to leave. */
function UnsavedBar(props: { dirty: boolean; saving: boolean; savedFlash: boolean; error: string | null; nudge: number; onDiscard: () => void; onSave: () => void }) {
  const show = props.dirty || props.savedFlash;
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4"
        >
          <motion.div
            key={props.nudge}
            animate={props.nudge ? { x: [0, -10, 10, -8, 8, -4, 4, 0] } : undefined}
            transition={{ duration: 0.45 }}
            className={cn(
              "pointer-events-auto flex w-full max-w-[600px] items-center gap-3 rounded-2xl border bg-[#161616]/95 py-2.5 pr-2.5 pl-4 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur",
              props.nudge && props.dirty ? "border-danger/60" : "border-white/10",
            )}
          >
            {props.savedFlash && !props.dirty ? (
              <span className="flex-1 py-2 text-sm text-success">Changes saved</span>
            ) : (
              <>
                <span className={cn("size-2 shrink-0 rounded-full", props.nudge ? "bg-danger" : "bg-brand")} />
                <span className="min-w-0 flex-1 text-sm leading-tight">
                  {props.error ? (
                    <span className="text-danger">{props.error}</span>
                  ) : props.nudge ? (
                    "Careful, you have unsaved changes!"
                  ) : (
                    "You have unsaved changes"
                  )}
                </span>
                <Button size="md" variant="ghost" onClick={props.onDiscard} disabled={props.saving}>
                  Discard
                </Button>
                <Button size="md" onClick={props.onSave} loading={props.saving}>
                  Save changes
                </Button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

