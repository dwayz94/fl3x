"use client";

import { useState } from "react";
import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

/** A read-only value that copies itself on click. */
export function CopyField({ value, display }: { value: string; display?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="group flex h-11 w-full items-center gap-2 rounded-xl bg-white/[0.04] px-3 text-left text-sm transition-colors hover:bg-white/[0.07]"
    >
      <span className="min-w-0 flex-1 truncate">{display ?? value}</span>
      <span className={cn("flex items-center gap-1 text-xs", copied ? "text-success" : "text-fg-3 group-hover:text-fg")}>
        <Icon icon={copied ? Tick02Icon : Copy01Icon} size={16} />
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

