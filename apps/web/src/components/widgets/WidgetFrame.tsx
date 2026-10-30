import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import type { WidgetSize } from "@fl3x/shared";
import { cn } from "@/lib/cn";

/** Grid footprint: large = 2×2 cells, long = 4×1 cells (grid has 4 cols on mobile, 8 on desktop). */
export const sizeClass: Record<WidgetSize, string> = {
  large: "col-span-2 row-span-2",
  long: "col-span-4 row-span-1",
};

/**
 * The widget's chosen background (`surface` / `surfaceColor` settings), set once by
 * WidgetView so every widget built on WidgetFrame gets it without doing anything.
 */
export const WidgetSurface = createContext<{ surface?: string; color?: string }>({});
/** The profile's tier, where it's known (profile, editor): color backgrounds need Premium. */
export const WidgetTier = createContext<string | null>(null);

export function WidgetFrame({
  size,
  opacity = 100,
  className,
  style,
  children,
  href,
  onLinkClick,
}: {
  size: WidgetSize;
  opacity?: number;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  href?: string;
  onLinkClick?: () => void;
}) {
  const classes = cn(
    "relative flex h-full w-full overflow-hidden rounded-[28px] p-4 text-left text-fg",
    size === "large" ? "flex-col" : "flex-row items-center gap-3",
    className,
  );
  // A white veil rather than a flat grey, so widgets read as glass over image backgrounds.
  const look = useContext(WidgetSurface);
  const s: CSSProperties = { background: `rgba(255, 255, 255, ${(0.1 * opacity) / 100})`, ...style };
  if (look.surface === "color" && look.color) {
    // The color fades into near-black at the bottom so white text stays readable on any shade.
    const c = look.color;
    s.background = `linear-gradient(160deg, color-mix(in srgb, ${c} ${opacity}%, transparent) 0%, color-mix(in srgb, ${c} ${Math.round(opacity * 0.55)}%, #0b0b0b) 100%)`;
  }
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} style={s} onClick={onLinkClick}>
        {children}
      </a>
    );
  }
  return (
    <div className={classes} style={s}>
      {children}
    </div>
  );
}

/** Moga title used across widgets. */
export function WTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("truncate font-primary text-lg leading-tight", className)}>{children}</p>;
}

export function WMuted({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("text-[10px] leading-tight text-fg-2", className)}>{children}</p>;
}

export function WPill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex h-6 items-center justify-center rounded-lg bg-brand px-3 text-xs font-normal text-bg", className)}>
      {children}
    </span>
  );
}

export function WEmpty({ size, label }: { size: WidgetSize; label: string }) {
  return (
    <WidgetFrame size={size} className="items-center justify-center text-center">
      <p className="w-full text-xs text-fg-3">{label}</p>
    </WidgetFrame>
  );
}

export function WSkeleton({ size }: { size: WidgetSize }) {
  return (
    <WidgetFrame size={size} className="animate-pulse">
      <span />
    </WidgetFrame>
  );
}

export function Avatar({ src, className }: { src?: string | null; className?: string }) {
  return (
    <div className={cn("size-12 shrink-0 overflow-hidden rounded-xl bg-white/10", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="" className="size-full object-cover" />}
    </div>
  );
}
