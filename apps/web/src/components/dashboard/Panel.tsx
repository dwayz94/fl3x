import type { ReactNode } from "react";
import { Brand } from "@/components/ui";
import { cn } from "@/lib/cn";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl">
          <Brand>{title}</Brand>
        </h1>
        {subtitle && <p className="mt-1 text-sm text-fg-3">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Panel({ label, title, aside, children, className }: { label?: string; title?: ReactNode; aside?: ReactNode; children?: ReactNode; className?: string }) {
  return (
    <section className={cn("flex flex-col rounded-2xl bg-[#0d0d0d] p-5", className)}>
      {(label || title) && (
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            {label && <p className="text-xs text-fg-3">{label}</p>}
            {title && <div className="mt-0.5 flex items-center gap-2 font-primary text-2xl leading-none">{title}</div>}
          </div>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Chip({ children, tone = "brand" }: { children: ReactNode; tone?: "brand" | "muted" | "success" }) {
  const tones = { brand: "bg-brand text-bg", muted: "bg-white/10 text-fg-2", success: "bg-success/15 text-success" };
  return <span className={cn("rounded-md px-1.5 py-0.5 font-secondary text-[11px] font-normal", tones[tone])}>{children}</span>;
}

/** The one loading indicator of the dashboard. `screen` centers it on the whole screen (before the layout exists). */
export function Spinner({ screen }: { screen?: boolean }) {
  return (
    <div className={screen ? "fixed inset-0 z-40 flex items-center justify-center bg-[#0b0b0b]" : "flex min-h-[50vh] items-center justify-center"}>
      <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
    </div>
  );
}
