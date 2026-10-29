"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import { LayoutGroup, motion } from "motion/react";
import type { Widget } from "@fl3x/shared";
import { WidgetView, sizeClass } from "@/components/widgets";
import { cn } from "@/lib/cn";

export interface EditorHooks {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (fromId: string, toId: string) => void;
  /** Click on the avatar in the preview: change it. */
  onAvatar?: () => void;
}

interface Press {
  id: string;
  x: number;
  y: number;
  el: HTMLElement;
  pointerType: string;
  timer?: number;
}

const SPRING = { type: "spring", stiffness: 520, damping: 40, mass: 0.8 } as const;
const DRAG_THRESHOLD = 5; // px of mouse movement before a press becomes a drag
const LONG_PRESS_MS = 280; // touch: hold to pick a widget up, like iOS

interface Drag {
  id: string;
  /** Pointer position, viewport coordinates. */
  x: number;
  y: number;
  /** Where the widget was grabbed, relative to its top-left corner. */
  dx: number;
  dy: number;
  width: number;
  height: number;
  /** CSS zoom applied to the preview (the clone renders outside it). */
  zoom: number;
}

/**
 * The widget grid of the editor preview. Drag a widget and the others move
 * out of the way in real time (spring layout animations); release and it
 * glides into its new slot. Click selects, as before.
 */
export function EditableGrid({ widgets, editor, className, style }: { widgets: Widget[]; editor: EditorHooks; className: string; style?: CSSProperties }) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const lastTarget = useRef<string | null>(null);
  const press = useRef<Press | null>(null);

  const start = (p: Press, x: number, y: number) => {
    const r = p.el.getBoundingClientRect();
    const zoom = r.width / p.el.offsetWidth || 1;
    lastTarget.current = p.id;
    setDrag({ id: p.id, x, y, dx: p.x - r.left, dy: p.y - r.top, width: r.width, height: r.height, zoom });
    navigator.vibrate?.(8);
  };

  useEffect(() => {
    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p) return;
      if (!drag) {
        const far = Math.hypot(e.clientX - p.x, e.clientY - p.y) > DRAG_THRESHOLD;
        if (p.pointerType === "mouse" && far) start(p, e.clientX, e.clientY);
        // Touch moving before the long press fires is a scroll: let it be.
        else if (p.pointerType !== "mouse" && far) {
          window.clearTimeout(p.timer);
          press.current = null;
        }
        return;
      }
      e.preventDefault();
      setDrag((d) => (d ? { ...d, x: e.clientX, y: e.clientY } : d));
      // Live reorder: the slot under the pointer makes room right away.
      const over = document
        .elementsFromPoint(e.clientX, e.clientY)
        .map((el) => (el as HTMLElement).closest<HTMLElement>("[data-slot]"))
        .find((el) => el && el.dataset.slot !== drag.id);
      const target = over?.dataset.slot ?? null;
      // Only react when entering a new slot, so two slots of different sizes can't ping-pong.
      if (target && target !== lastTarget.current) {
        lastTarget.current = target;
        editor.onMove(drag.id, target);
      } else if (!target) {
        lastTarget.current = null;
      }
    };
    const up = () => {
      const p = press.current;
      if (p) window.clearTimeout(p.timer);
      if (p && !drag) editor.onSelect(p.id);
      press.current = null;
      setDrag(null);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  });

  const dragged = drag && widgets.find((w) => w.id === drag.id);

  return (
    <LayoutGroup>
      <div className={className} style={style}>
        {widgets.map((w) => {
          const selected = editor.selectedId === w.id;
          const lifted = drag?.id === w.id;
          return (
            <motion.div
              key={w.id}
              data-slot={w.id}
              layout
              transition={SPRING}
              className={cn("relative touch-pan-y select-none", sizeClass[w.size], drag ? "cursor-grabbing" : "cursor-grab")}
              onPointerDown={(e) => {
                if (e.button !== 0) return;
                const p: Press = { id: w.id, x: e.clientX, y: e.clientY, el: e.currentTarget as HTMLElement, pointerType: e.pointerType };
                press.current = p;
                if (e.pointerType !== "mouse") p.timer = window.setTimeout(() => press.current === p && start(p, p.x, p.y), LONG_PRESS_MS);
              }}
              onClickCapture={(e) => {
                // Links inside widgets don't navigate in the editor.
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              {lifted ? (
                // The empty slot the widget will drop into.
                <div className="size-full rounded-[28px] border-2 border-dashed border-white/25 bg-white/[0.04]" />
              ) : (
                <motion.div
                  layoutId={`widget-${w.id}`}
                  transition={SPRING}
                  className={cn(
                    "pointer-events-none size-full rounded-[28px] transition-shadow",
                    selected ? "shadow-[0_0_0_2px_#fff,0_10px_30px_rgba(0,0,0,0.5)]" : "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]",
                    drag && "animate-wiggle",
                  )}
                  style={drag ? { animationDelay: `${(w.id.charCodeAt(0) % 5) * -0.07}s` } : undefined}
                >
                  <WidgetView w={w} interactive={false} />
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
      {drag &&
        dragged &&
        createPortal(
          <motion.div
            layoutId={`widget-${dragged.id}`}
            transition={SPRING}
            className="pointer-events-none fixed z-[100] rounded-[28px] bg-[#1c1c1c]/85 shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl"
            style={{ left: drag.x - drag.dx, top: drag.y - drag.dy, width: drag.width, height: drag.height }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.06, rotate: -1.5 }}
          >
            <div style={{ zoom: drag.zoom, width: drag.width / drag.zoom, height: drag.height / drag.zoom }}>
              <WidgetView w={dragged} interactive={false} />
            </div>
          </motion.div>,
          document.body,
        )}
    </LayoutGroup>
  );
}
