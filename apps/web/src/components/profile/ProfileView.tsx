"use client";

import type { DragEvent, ReactNode } from "react";
import { CheckmarkBadge01Icon, EyeIcon } from "@hugeicons/core-free-icons";
import { BADGES, type EditableProfile, type Tier } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { WidgetView, sizeClass } from "@/components/widgets";
import { fmtNumber } from "@/lib/format";
import { cn } from "@/lib/cn";
import { linkIcons } from "./links";
import { fontClass } from "./theme";

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
  const { theme } = profile;
  const badges = BADGES.filter((b) => profile.badges.includes(b.id));
  const name = profile.displayName || profile.username;

  return (
    <article className="w-full max-w-[760px] rounded-[40px] bg-[#1f1f1f]/95 p-5 shadow-[0_30px_80px_rgba(0,0,0,0.5)] md:p-8">
      <header className="flex items-center gap-4 md:gap-5">
        <div className="size-[72px] shrink-0 overflow-hidden rounded-full bg-white/10 md:size-[88px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {profile.avatarUrl && <img src={profile.avatarUrl} alt="" className="size-full object-cover" />}
        </div>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className={cn("flex items-center gap-2 truncate text-3xl leading-none md:text-4xl", fontClass[theme.font])}>
            <span className="truncate">{name}</span>
            {tier !== "none" && (
              // Premium badge takes the profile accent, Starter the classic verified cyan.
              <span
                className="shrink-0"
                title={tier === "premium" ? "Premium holder" : "Holder"}
                style={{ color: tier === "premium" ? theme.accent : "#00F6FF", filter: `drop-shadow(0 0 12px ${tier === "premium" ? theme.accent : "#00F6FF"}99)` }}
              >
                <Icon icon={CheckmarkBadge01Icon} size={24} />
              </span>
            )}
          </h1>
          {badges.length > 0 && (
            <div className="flex w-fit flex-wrap gap-1 rounded-xl bg-white/10 px-2 py-1">
              {badges.map((b) => (
                <span key={b.id} title={`${b.name}: ${b.description}`} className="text-sm leading-none">
                  {b.emoji}
                </span>
              ))}
            </div>
          )}
          {profile.bio && <p className="text-xs text-fg-2 md:text-sm">{profile.bio}</p>}
        </div>
      </header>

      {profile.widgets.length > 0 && (
        <div className="mt-6 grid auto-rows-[96px] grid-flow-dense grid-cols-4 gap-2.5 md:grid-cols-8">
          {profile.widgets.map((w) => (
            <Slot key={w.id} id={w.id} className={sizeClass[w.size]} editor={editor}>
              <WidgetView w={w} interactive={!editor} />
            </Slot>
          ))}
        </div>
      )}

      <footer className="mt-6 flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
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
              <Icon icon={linkIcons[l.kind]} size={22} />
            </a>
          ))}
        </div>
        {views != null && (
          <span className="flex items-center gap-1.5 font-primary text-lg text-fg-2">
            <Icon icon={EyeIcon} size={20} />
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
        "cursor-grab rounded-[24px] transition-[box-shadow,transform] active:cursor-grabbing",
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
