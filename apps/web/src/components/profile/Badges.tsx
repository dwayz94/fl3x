"use client";

import { useEffect, useRef, useState } from "react";
import { BADGES, badgeDetail, type BadgeDef } from "@fl3x/shared";
import { cn } from "@/lib/cn";

export function BadgeIcon({ id, size = 20, className }: { id: string; size?: number; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/images/badges/${id}.svg`} alt="" width={size} height={size} className={cn("shrink-0", className)} />;
}

/**
 * The badge pill under the username. Hover (desktop) or tap (mobile) a
 * badge to see what it is and how it was earned.
 */
export function BadgeStrip({
  ids,
  stats = { memberNumber: null, referrals: 0 },
  interactive = true,
}: {
  ids: string[];
  stats?: { memberNumber: number | null; referrals: number };
  interactive?: boolean;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const ref = useRef<HTMLUListElement>(null);
  const badges = BADGES.filter((b) => ids.includes(b.id));

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => ref.current?.contains(e.target as Node) || setOpen(null);
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  if (badges.length === 0) return null;
  return (
    <ul ref={ref} className="relative flex w-fit max-w-full flex-wrap gap-x-2 gap-y-1 rounded-full bg-white/10 px-3 py-1.5">
      {badges.map((b) => (
        <li
          key={b.id}
          className="relative"
          onMouseEnter={() => interactive && setOpen(b.id)}
          onMouseLeave={() => interactive && setOpen((o) => (o === b.id ? null : o))}
        >
          <button
            type="button"
            aria-label={b.name}
            disabled={!interactive}
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => (o === b.id ? null : b.id));
            }}
            className="block transition-transform hover:scale-125 disabled:cursor-inherit"
          >
            <BadgeIcon id={b.id} size={20} />
          </button>
          {open === b.id && <BadgeTip badge={b} detail={badgeDetail(b, stats)} />}
        </li>
      ))}
    </ul>
  );
}

function BadgeTip({ badge, detail }: { badge: BadgeDef; detail: string | null }) {
  return (
    <div
      role="tooltip"
      className="absolute top-full left-1/2 z-30 mt-2.5 w-52 -translate-x-1/2 rounded-2xl border border-white/10 bg-[#141414]/95 p-3 text-left shadow-[0_12px_40px_rgba(0,0,0,0.6)] backdrop-blur-xl"
    >
      <span className="absolute -top-1.5 left-1/2 size-3 -translate-x-1/2 rotate-45 border-t border-l border-white/10 bg-[#141414]" />
      <div className="flex items-center gap-2">
        <BadgeIcon id={badge.id} size={22} />
        <span className="font-primary text-lg leading-none" style={{ color: badge.color }}>
          {badge.name}
        </span>
        {detail && <span className="ml-auto rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-fg-2">{detail}</span>}
      </div>
      <p className="mt-1.5 text-xs leading-snug text-fg-2 normal-case">{badge.description}</p>
    </div>
  );
}
