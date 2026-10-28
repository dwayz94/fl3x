import type { CSSProperties } from "react";
import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function Icon({ icon, size = 20, className, style }: { icon: IconSvgElement; size?: number; className?: string; style?: CSSProperties }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.5} className={className} style={style} />;
}
