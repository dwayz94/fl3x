import { HugeiconsIcon, type IconSvgElement } from "@hugeicons/react";

export function Icon({ icon, size = 20, className }: { icon: IconSvgElement; size?: number; className?: string }) {
  return <HugeiconsIcon icon={icon} size={size} strokeWidth={1.5} className={className} />;
}
