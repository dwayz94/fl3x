import type { ReactNode } from "react";

/** Soft rise-and-fade when switching dashboard pages (keyed so it replays on each page). */
export function PageFade({ id, children }: { id: string; children: ReactNode }) {
  return (
    <div key={id} className="animate-page-in">
      {children}
    </div>
  );
}
