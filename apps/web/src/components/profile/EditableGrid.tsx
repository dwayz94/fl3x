"use client";

import { memo, useEffect, useRef, useState, type CSSProperties } from "react";
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
  /** A widget being dragged in from the library: shown as its empty slot. */
  incomingId?: string | null;
  /** Widgets that can't be saved yet (missing settings): outlined. */
  incompleteIds?: string[];
  /** Inline edit of the display name and bio, right on the card. */
  onIdentity?: (patch: { displayName?: string | null; bio?: string | null }) => void;
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
  /** Where the widget was grabbed, relative to its top-left corner. */
  dx: number;
  dy: number;
  /** Start position of the clone, viewport coordinates. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** CSS zoom applied to the preview (the clone renders outside it). */
  zoom: number;
}

/**
 * The widget grid of the editor preview. Drag a widget and the others move
 * out of the way in real time (spring layout animations); release and it
 * glides into its new slot. Click selects, as before.
 *
 * Performance: the pointer only moves the floating clone through its DOM
 * style (no React render per frame). React renders when the hovered slot
 * changes, and the slots are memoized so only the moved ones re-render.
 */
export function EditableGrid({ widgets, editor, className, style }: { widgets: Widget[]; editor: EditorHooks; className: string; style?: CSSProperties }) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const dragRef = useRef<Drag | null>(null);
  const clone = useRef<HTMLDivElement>(null);
  const lastTarget = useRef<string | null>(null);
  const press = useRef<Press | null>(null);
  const frame = useRef(0);
  const pointer = useRef({ x: 0, y: 0 });
  // Latest editor callbacks, read from the window listeners without re-binding them.
  const hooks = useRef(editor);
  hooks.current = editor;

  useEffect(() => {
    const start = (p: Press) => {
      const r = p.el.getBoundingClientRect();
      const zoom = r.width / p.el.offsetWidth || 1;
      lastTarget.current = p.id;
      const d = { id: p.id, dx: p.x - r.left, dy: p.y - r.top, left: r.left, top: r.top, width: r.width, height: r.height, zoom };
      dragRef.current = d;
      setDrag(d);
      navigator.vibrate?.(8);
    };

    // One frame of work per animation frame, whatever the pointer rate.
    const tick = () => {
      frame.current = 0;
      const d = dragRef.current;
      if (!d) return;
      const { x, y } = pointer.current;
      if (clone.current) clone.current.style.translate = `${x - d.dx - d.left}px ${y - d.dy - d.top}px`;
      // Live reorder: the slot under the pointer makes room right away.
      const hit = document.elementsFromPoint(x, y);
      let target: string | null = null;
      for (const el of hit) {
        const slot = (el as HTMLElement).closest<HTMLElement>("[data-slot]");
        if (slot && slot.dataset.slot !== d.id) {
          target = slot.dataset.slot!;
          break;
        }
      }
      // Only react when entering a new slot, so two slots of different sizes can't ping-pong.
      if (target && target !== lastTarget.current) {
        lastTarget.current = target;
        hooks.current.onMove(d.id, target);
      } else if (!target) {
        lastTarget.current = null;
      }
    };

    const move = (e: PointerEvent) => {
      const p = press.current;
      if (!p) return;
      if (!dragRef.current) {
        const far = Math.hypot(e.clientX - p.x, e.clientY - p.y) > DRAG_THRESHOLD;
        if (p.pointerType === "mouse" && far) start(p);
        // Touch moving before the long press fires is a scroll: let it be.
        else if (p.pointerType !== "mouse" && far) {
          window.clearTimeout(p.timer);
          press.current = null;
        }
        if (!dragRef.current) return;
      }
      e.preventDefault();
      pointer.current = { x: e.clientX, y: e.clientY };
      if (!frame.current) frame.current = requestAnimationFrame(tick);
    };
    const up = () => {
      const p = press.current;
      if (p) window.clearTimeout(p.timer);
      if (p && !dragRef.current) hooks.current.onSelect(p.id);
      press.current = null;
      cancelAnimationFrame(frame.current);
      frame.current = 0;
      if (dragRef.current) {
        dragRef.current = null;
        setDrag(null);
      }
    };
    const down = (e: Event) => {
      const { id, event, el } = (e as CustomEvent<{ id: string; event: PointerEvent; el: HTMLElement }>).detail;
      const p: Press = { id, x: event.clientX, y: event.clientY, el, pointerType: event.pointerType };
      press.current = p;
      pointer.current = { x: p.x, y: p.y };
      if (p.pointerType !== "mouse") p.timer = window.setTimeout(() => press.current === p && start(p), LONG_PRESS_MS);
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("fl3x-slot-down", down);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("fl3x-slot-down", down);
      cancelAnimationFrame(frame.current);
    };
  }, []);

  const dragged = drag && widgets.find((w) => w.id === drag.id);

  return (
    <LayoutGroup>
      <div className={className} style={style}>
        {widgets.map((w) => (
          <Slot
            key={w.id}
            w={w}
            selected={editor.selectedId === w.id}
            incomplete={!!editor.incompleteIds?.includes(w.id)}
            lifted={drag?.id === w.id || editor.incomingId === w.id}
            dragging={!!drag || !!editor.incomingId}
          />
        ))}
      </div>
      {drag &&
        dragged &&
        createPortal(
          <motion.div
            ref={clone}
            layoutId={`widget-${dragged.id}`}
            transition={SPRING}
            className="pointer-events-none fixed z-[100] will-change-transform"
            style={{ left: drag.left, top: drag.top, width: drag.width, height: drag.height }}
          >
            {/* Lift effect on an inner node: the outer one belongs to the layout animation. */}
            <motion.div
              className="size-full rounded-[28px] bg-[#1c1c1c] shadow-[0_24px_60px_rgba(0,0,0,0.6)]"
              initial={{ scale: 1, rotate: 0 }}
              animate={{ scale: 1.05, rotate: -1.5 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <div style={{ zoom: drag.zoom, width: drag.width / drag.zoom, height: drag.height / drag.zoom }}>
                <WidgetView w={dragged} interactive={false} />
              </div>
            </motion.div>
          </motion.div>,
          document.body,
        )}
    </LayoutGroup>
  );
}

/** One widget of the grid. Memoized: a drag only re-renders the slots that change. */
const Slot = memo(function Slot({ w, selected, lifted, dragging, incomplete }: { w: Widget; selected: boolean; lifted: boolean; dragging: boolean; incomplete?: boolean }) {
  return (
    <motion.div
      data-slot={w.id}
      layout="position"
      transition={SPRING}
      className={cn("relative touch-pan-y select-none", sizeClass[w.size], dragging ? "cursor-grabbing" : "cursor-grab")}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        // Handled by the grid's window listeners (stable across renders).
        window.dispatchEvent(new CustomEvent("fl3x-slot-down", { detail: { id: w.id, event: e.nativeEvent, el: e.currentTarget } }));
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
            selected ? "shadow-[0_0_0_2px_#fff,0_10px_30px_rgba(0,0,0,0.5)]" : incomplete ? "shadow-[0_0_0_2px_#FFB547]" : "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]",
          )}
        >
          {/* The jiggle lives on its own node so it never fights the layout transform. */}
          <div className={cn("size-full", dragging && "animate-wiggle")} style={dragging ? { animationDelay: `${(w.id.charCodeAt(0) % 5) * -0.07}s` } : undefined}>
            <WidgetView w={w} interactive={false} />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
