import type { CSSProperties } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

/** A site's own logo, redrawn in one color (fills, no stroke) to sit next to Hugeicons. */
export interface BrandIcon {
  viewBox: string;
  /** Path data, filled with currentColor (even-odd, so inner shapes cut holes). */
  d: string;
}

export type AnyIcon = IconSvgElement | BrandIcon;

const isBrand = (icon: AnyIcon): icon is BrandIcon => !Array.isArray(icon);

export function Icon({ icon, size = 20, className, style }: { icon: AnyIcon; size?: number; className?: string; style?: CSSProperties }) {
  if (isBrand(icon)) {
    return (
      <svg width={size} height={size} viewBox={icon.viewBox} className={className} style={style} fill="currentColor" aria-hidden>
        <path d={icon.d} fillRule="evenodd" />
      </svg>
    );
  }
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.5} className={className} style={style} />;
}
