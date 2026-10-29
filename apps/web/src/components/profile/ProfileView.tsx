"use client";

import type { DragEvent, ReactNode } from "react";
import { CheckmarkBadge01Icon, EyeIcon } from "@hugeicons/core-free-icons";
import { BADGES, type EditableProfile, type Tier, type Widget } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { WidgetView, sizeClass } from "@/components/widgets";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { badgeIcons, fallbackBadgeIcon } from "./badges";
import { linkIcons } from "./links";
import { fontClass } from "./theme";

/**
 * Desktop column count (each column is one grid cell). Mirrors the Figma
 * variants: the card hugs its widgets, from 4 columns (one large widget or
 * a stack of longs) up to 8.
 */
function columnsFor(widgets: Widget[]) {
  const large = widgets.filter((w) => w.size === "large").length;
  const long = widgets.length - large;
  const band = large * 2 + Math.ceil(long / 2) * 4; // longs stack two per large-height band
  return Math.min(8, Math.max(4, band + (band % 2)));
}

export interface EditorHooks {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onMove: (fromId: string, toId: string) => void;
}

/**
 * The profile card. Used as-is on fl3x.lol/@username and as the live
 * preview in the editor (with `editor` hooks for selection and drag).
 */
export function ProfileView({
  profile,
  tier,
  views,
  editor,
  onLinkClick,
}: {
  profile: EditableProfile;
  tier: Tier;
  views?: number;
  editor?: EditorHooks;
  onLinkClick?: (target: string) => void;
}) {
  // In the editor the card keeps its real desktop width and the preview scales it down.
  const { theme } = profile;
  const badges = BADGES.filter((b) => profile.badges.includes(b.id));
  const name = profile.displayName || profile.username;
  const cols = columnsFor(profile.widgets);
  // Narrow cards stack the header like the small Figma variants.
  const narrow = cols <= 4;
  const verified = tier !== "none" && (
    // Premium badge takes the profile accent, Starter the classic verified cyan.
    <span
      className="shrink-0"
      title={tier === "premium" ? "Premium holder" : "Holder"}
      style={{ color: tier === "premium" ? theme.accent : "#00F6FF", filter: `drop-shadow(0 0 12px ${tier === "premium" ? theme.accent : "#00F6FF"}99)` }}
    >
      <Icon icon={CheckmarkBadge01Icon} size={26} />
    </span>
  );

  return (
    <article
      style={{ "--cols": cols } as React.CSSProperties}
      className={cn(
        "w-full rounded-[40px] border border-white/[0.06] bg-[rgba(28,28,28,0.6)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)] backdrop-blur-[40px] md:p-8",
        // Card hugs the grid: cols × 80px cells + 12px gaps + padding.
        editor
          ? "md:w-[calc(var(--cols)*80px+(var(--cols)-1)*12px+66px)] md:max-w-none"
          : "md:max-w-[calc(var(--cols)*80px+(var(--cols)-1)*12px+66px)]",
      )}
    >
      <header className={cn("flex gap-4 md:gap-6", narrow ? "flex-col items-center text-center" : "items-center")}>
        <div className="size-[84px] shrink-0 overflow-hidden rounded-full bg-white/10 md:size-[120px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {profile.avatarUrl && <img src={profile.avatarUrl} alt="" className="size-full object-cover" />}
        </div>
        <div className={cn("flex min-w-0 flex-col gap-2", narrow && "items-center")}>
          <h1 className={cn("flex max-w-full items-center gap-2 text-[34px] leading-none uppercase md:text-[44px]", fontClass[theme.font])}>
            <span className="truncate">{name}</span>
            {verified}
          </h1>
          {badges.length > 0 && (
            <ul className="flex w-fit max-w-full flex-wrap gap-x-2.5 gap-y-1 rounded-full bg-white/10 px-3 py-1.5">
              {badges.map((b) => (
                <li key={b.id} title={`${b.name}: ${b.description}`} className="text-white/85">
                  <Icon icon={badgeIcons[b.id] ?? fallbackBadgeIcon} size={18} />
                </li>
              ))}
            </ul>
          )}
          {profile.bio && <p className="text-xs uppercase text-fg-2 md:text-sm">{profile.bio}</p>}
        </div>
      </header>

      {profile.widgets.length > 0 && (
        <div className="mt-7 grid auto-rows-[96px] grid-flow-dense grid-cols-4 gap-3 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]">
          {profile.widgets.map((w) => (
            <Slot key={w.id} id={w.id} className={sizeClass[w.size]} editor={editor}>
              <WidgetView w={w} interactive={!editor} />
            </Slot>
          ))}
        </div>
      )}

      <footer className="mt-7 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          {profile.links.map((l) => (
            <a
              key={l.id}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              title={l.label ?? l.kind}
              onClick={(e) => {
                if (editor) e.preventDefault();
                onLinkClick?.(l.kind === "custom" ? (l.label ?? "custom") : l.kind);
              }}
              className="text-fg-2 transition-colors hover:text-fg"
            >
              <Icon icon={linkIcons[l.kind]} size={24} />
            </a>
          ))}
        </div>
        {views != null && (
          <span className="flex items-center gap-1.5 font-primary text-xl text-fg-2">
            <Icon icon={EyeIcon} size={22} />
            {fmtNumber(views)}
          </span>
        )}
      </footer>
    </article>
  );
}

function Slot({ id, className, editor, children }: { id: string; className: string; editor?: EditorHooks; children: ReactNode }) {
  if (!editor) return <div className={className}>{children}</div>;
  const selected = editor.selectedId === id;
  return (
    <div
      className={cn(
        "cursor-grab rounded-[28px] transition-[box-shadow,transform] active:cursor-grabbing",
        selected ? "scale-[1.02] shadow-[0_0_0_2px_#fff,0_10px_30px_rgba(0,0,0,0.5)]" : "hover:shadow-[0_0_0_1px_rgba(255,255,255,0.3)]",
        className,
      )}
      draggable
      onDragStart={(e: DragEvent) => e.dataTransfer.setData("text/widget", id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const from = e.dataTransfer.getData("text/widget");
        if (from && from !== id) editor.onMove(from, id);
      }}
      onClickCapture={(e) => {
        e.preventDefault();
        e.stopPropagation();
        editor.onSelect(id);
      }}
    >
      <div className="pointer-events-none h-full">{children}</div>
    </div>
  );
}
