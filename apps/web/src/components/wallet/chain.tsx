"use client";

import { EthereumIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import type { WalletChain } from "@fl3x/shared";
import { Icon, type BrandIcon } from "@/components/ui";
import { cn } from "@/lib/cn";

/** Solana's three bars, one color. */
export const SolanaMark: BrandIcon = { viewBox: "0 0 24 24", d: "M6.2 4h15.3l-3.7 3.6H2.5zM2.5 10.2h15.3l3.7 3.6H6.2zM6.2 16.4h15.3l-3.7 3.6H2.5z" };

export const CHAINS: Record<WalletChain, { label: string; icon: typeof SolanaMark | typeof EthereumIcon; tint: string }> = {
  solana: { label: "Solana", icon: SolanaMark, tint: "bg-[#9945FF]/15 text-[#C9A8FF]" },
  evm: { label: "EVM", icon: EthereumIcon, tint: "bg-[#627EEA]/15 text-[#AFC0FF]" },
};

/** Small pill with the chain's mark: Solana or EVM (Ethereum, Base, BNB…). */
export function ChainBadge({ chain, className }: { chain: WalletChain; className?: string }) {
  const c = CHAINS[chain];
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] leading-none", c.tint, className)}>
      <Icon icon={c.icon} size={10} />
      {c.label}
    </span>
  );
}

/** A wallet app's logo (data URI from the extension, or ours), else its initial. */
export function WalletLogo({ icon, name, size = 36 }: { icon?: string | null; name?: string; size?: number }) {
  return (
    <span className="flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/[0.08] text-fg-2" style={{ width: size, height: size }}>
      {icon ? (
        // Extension icons are data URIs; next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={icon} alt="" className="size-full object-cover" />
      ) : name ? (
        <span className="font-primary text-lg leading-none uppercase">{name[0]}</span>
      ) : (
        <Icon icon={Wallet01Icon} size={size / 2} />
      )}
    </span>
  );
}

/** A linked wallet has no app, only a chain: show the chain's mark in its tint. */
export function ChainTile({ chain, size = 36 }: { chain: WalletChain; size?: number }) {
  const c = CHAINS[chain];
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-xl", c.tint)} style={{ width: size, height: size }}>
      <Icon icon={c.icon} size={Math.round(size * 0.45)} />
    </span>
  );
}
