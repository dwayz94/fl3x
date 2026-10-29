import { cn } from "@/lib/cn";

/**
 * The Premium checkmark from the Figma (node 496:201), glow included.
 * The SVG carries ~49% padding for the glow, so the image overflows the box.
 */
export function Verified({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cn("relative inline-block shrink-0", className)} style={{ width: size, height: size }} title="Premium holder">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/verified.svg" alt="Premium" className="pointer-events-none absolute inset-[-48.84%] max-w-none size-[197.7%]" />
    </span>
  );
}
