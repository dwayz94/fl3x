"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import type { LinkedWallet, Me } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { Icon } from "@/components/ui";
import { ChainTile, CHAINS } from "@/components/wallet/chain";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { EmptyWallets, LinkWalletButton } from "@/components/wallet/LinkWallet";
import { api } from "@/lib/api";
import { shortAddress } from "@/lib/format";

/** Linked wallets (Solana + EVM). Each one is proven with a signature, combined in wallet widgets. */
export function WalletsPanel({ me }: { me: Me }) {
  const [open, setOpen] = useState(false);
  const wallets = me.linkedWallets;

  return (
    <div className="flex flex-col gap-1.5">
      {wallets.map((w) => (
        <WalletRow key={w.id} wallet={w} />
      ))}
      {wallets.length === 0 ? (
        <EmptyWallets onLink={() => setOpen(true)} />
      ) : (
        <LinkWalletButton onClick={() => setOpen(true)} label="Link another wallet" />
      )}
      <ConnectWalletModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}

function WalletRow({ wallet: w }: { wallet: LinkedWallet }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);

  const remove = async () => {
    setRemoving(true);
    try {
      qc.setQueryData(["me"], await api<Me>(`/me/wallets/${w.id}`, { method: "DELETE", token: await getToken() }));
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
      void qc.invalidateQueries({ queryKey: ["nfts"] });
    } finally {
      setRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <div className="flex h-14 items-center gap-3 rounded-2xl bg-white/[0.04] px-2.5">
      <ChainTile chain={w.chain} size={36} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{w.label || `${CHAINS[w.chain].label} wallet`}</p>
        <p className="truncate font-mono text-[11px] text-fg-3" title={w.address}>
          {shortAddress(w.address)}
        </p>
      </div>
      {w.source === "login" ? (
        <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] leading-none text-fg-3">Sign-in wallet</span>
      ) : confirming ? (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1.5 text-xs text-fg-3 hover:text-fg">
            Keep
          </button>
          <button
            type="button"
            disabled={removing}
            onClick={() => void remove()}
            className="rounded-lg bg-danger/15 px-2.5 py-1.5 text-xs text-danger transition-colors hover:bg-danger/25 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Remove wallet"
          title="Remove wallet"
          onClick={() => setConfirming(true)}
          className="flex size-8 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Icon icon={Delete02Icon} size={16} />
        </button>
      )}
    </div>
  );
}
