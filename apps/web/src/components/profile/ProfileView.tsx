"use client";

import { EyeIcon } from "@hugeicons/core-free-icons";
import type { EditableProfile, FullPublicProfile, Tier, Widget } from "@fl3x/shared";
import { Icon, Verified } from "@/components/ui";
import { WidgetView, sizeClass } from "@/components/widgets";
import { fmtNumber } from "@/lib/format";
import { WidgetHost } from "@/lib/use-portfolio";
import { cn } from "@/lib/cn";
import { BadgeStrip } from "./Badges";
import { EditableGrid, type EditorHooks } from "./EditableGrid";
import { linkIcons } from "./links";
import { fontClass } from "./theme";

const GRID = "mt-7 grid auto-rows-[96px] grid-flow-dense grid-cols-4 gap-3 md:grid-cols-[repeat(var(--cols),minmax(0,1fr))]";

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

export type { EditorHooks } from "./EditableGrid";

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
  const name = profile.displayName || profile.username;
  const cols = columnsFor(profile.widgets);
  // Narrow cards stack the header like the small Figma variants.
  const narrow = cols <= 4;
  // The checkmark is Premium-only.
  const verified = tier === "premium" && <Verified size={26} />;

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
        <Avatar url={profile.avatarUrl} onEdit={editor?.onAvatar} />
        <div className={cn("flex min-w-0 flex-col gap-2", narrow && "items-center")}>
          <h1 className={cn("flex max-w-full items-center gap-2 text-[34px] leading-none uppercase md:text-[44px]", fontClass[theme.font])}>
            <span className="truncate">{name}</span>
            {verified}
          </h1>
          <BadgeStrip ids={profile.badges} stats={(profile as Partial<FullPublicProfile>).badgeStats} interactive={!editor} />
          {profile.bio && <p className="text-xs uppercase text-fg-2 md:text-sm">{profile.bio}</p>}
        </div>
      </header>

      {profile.widgets.length > 0 && (
        <WidgetHost.Provider value={editor ? "editor" : "public"}>
          {editor ? (
            <EditableGrid widgets={profile.widgets} editor={editor} className={GRID} />
          ) : (
            <div className={GRID}>
              {profile.widgets.map((w) => (
                <div key={w.id} className={sizeClass[w.size]}>
                  <WidgetView w={w} />
                </div>
              ))}
            </div>
          )}
        </WidgetHost.Provider>
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

function Avatar({ url, onEdit }: { url: string | null; onEdit?: () => void }) {
  const img = (
    // eslint-disable-next-line @next/next/no-img-element
    url && <img src={url} alt="" className="size-full object-cover" />
  );
  const cls = "relative size-[84px] shrink-0 overflow-hidden rounded-full bg-white/10 md:size-[120px]";
  if (!onEdit) return <div className={cls}>{img}</div>;
  return (
    <button type="button" onClick={onEdit} className={cn(cls, "group")} title="Change your picture">
      {img}
      <span className="absolute inset-0 flex items-center justify-center bg-black/55 text-xs opacity-0 transition-opacity group-hover:opacity-100">Change</span>
    </button>
  );
}
