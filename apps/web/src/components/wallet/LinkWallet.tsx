"use client";

import { WalletAdd01Icon } from "@hugeicons/core-free-icons";
import { Icon } from "@/components/ui";

/** Pink "+ wallet" row, used under wallet lists (Settings, join, Customize). */
export function LinkWalletButton({ onClick, label = "Link a wallet" }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex h-12 w-full items-center gap-3 rounded-2xl border border-dashed border-white/10 px-2 text-sm text-fg-2 transition-colors hover:border-brand/50 hover:text-fg"
    >
      <span className="flex size-8 items-center justify-center rounded-xl bg-brand/10 text-brand transition-colors group-hover:bg-brand group-hover:text-bg">
        <Icon icon={WalletAdd01Icon} size={16} />
      </span>
      {label}
    </button>
  );
}

/** No wallet yet: one line on what it's for and the button. */
export function EmptyWallets({ onLink, compact }: { onLink: () => void; compact?: boolean }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-white/10 px-4 py-5 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
        <Icon icon={WalletAdd01Icon} size={20} />
      </span>
      <p className="mt-3 text-sm">No wallet linked yet</p>
      <p className="mt-1 max-w-[260px] text-xs text-fg-3">
        {compact ? "Link one to fill this widget. It's saved to your account." : "Link Solana or EVM wallets: wallet widgets add them up, $FL3X on Solana unlocks your tier."}
      </p>
      <button type="button" onClick={onLink} className="mt-4 flex h-9 items-center gap-1.5 rounded-xl bg-brand px-3.5 text-sm text-bg transition-[filter] hover:brightness-110">
        <Icon icon={WalletAdd01Icon} size={16} />
        Link a wallet
      </button>
    </div>
  );
}
