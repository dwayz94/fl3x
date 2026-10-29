"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Add01Icon, ArrowUpRight01Icon, Cancel01Icon, Delete02Icon, Wallet01Icon } from "@hugeicons/core-free-icons";
import type { LinkedWallet, Me } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { ChainDot } from "@/components/editor/Field";
import { Button, FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { shortAddress } from "@/lib/format";
import { detectWallets, KNOWN_WALLETS, type DetectedWallet } from "@/lib/wallet-connect";

/** Linked wallets (Solana + EVM). Each one is proven with a signature, combined in wallet widgets. */
export function WalletsPanel({ me }: { me: Me }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const remove = async (w: LinkedWallet) => {
    setRemoving(w.id);
    try {
      qc.setQueryData(["me"], await api<Me>(`/me/wallets/${w.id}`, { method: "DELETE", token: await getToken() }));
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {me.linkedWallets.map((w) => (
        <div key={w.id} className="flex h-11 items-center gap-2 rounded-xl bg-white/[0.04] px-3 text-sm">
          <ChainDot chain={w.chain} />
          <span className="min-w-0 flex-1 truncate font-mono text-xs">
            {shortAddress(w.address)} <span className="text-fg-3">· {w.address}</span>
          </span>
          {w.source === "login" ? (
            <span className="text-[10px] text-fg-3">Sign-in wallet</span>
          ) : (
            <button
              type="button"
              aria-label="Remove wallet"
              disabled={removing === w.id}
              onClick={() => void remove(w)}
              className="text-fg-3 transition-colors hover:text-danger disabled:opacity-40"
            >
              <Icon icon={Delete02Icon} size={16} />
            </button>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center gap-2 rounded-xl border border-dashed border-white/15 px-3 text-sm text-fg-2 transition-colors hover:border-brand hover:text-fg"
      >
        <Icon icon={Add01Icon} size={16} />
        {me.linkedWallets.length ? "Add another wallet" : "Link a wallet"}
        <span className="ml-auto text-[10px] text-fg-3">Solana · Ethereum · Base · BNB · Arbitrum…</span>
      </button>
      <p className="text-[11px] text-fg-3">Wallet widgets add up every wallet here. Linking only asks for a free signature.</p>
      {open && <ConnectModal onClose={() => setOpen(false)} onLinked={(next) => qc.setQueryData(["me"], next)} />}
    </div>
  );
}

function ConnectModal({ onClose, onLinked }: { onClose: () => void; onLinked: (me: Me) => void }) {
  const { getToken } = useAuth();
  const [wallets, setWallets] = useState<DetectedWallet[] | null>(null);
  const [step, setStep] = useState<{ id: string; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void detectWallets().then(setWallets);
  }, []);

  const link = async (w: DetectedWallet) => {
    setError(null);
    try {
      setStep({ id: w.id, text: "Approve the connection…" });
      const address = await w.connect();
      const token = await getToken();
      const { nonce, message } = await api<{ nonce: string; message: string }>("/me/wallets/challenge", { token, json: { address } });
      setStep({ id: w.id, text: "Sign the message in your wallet…" });
      const signature = await w.sign(address, message);
      setStep({ id: w.id, text: "Checking the signature…" });
      onLinked(await api<Me>("/me/wallets", { token, json: { address, nonce, signature } }));
      onClose();
    } catch (err) {
      const rejected = err && typeof err === "object" && "code" in err && (err as { code: unknown }).code === 4001;
      setError(err instanceof ApiRequestError ? err.message : rejected ? "Request cancelled in the wallet" : "The wallet didn't answer. Unlock it and try again.");
      setStep(null);
    }
  };

  const missing = KNOWN_WALLETS.filter((k) => !wallets?.some((w) => k.match.test(w.name)));

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[28px] border border-white/10 bg-[#121212] p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-primary text-2xl leading-none">Link a wallet</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="text-fg-3 hover:text-fg">
            <Icon icon={Cancel01Icon} size={20} />
          </button>
        </div>

        {wallets === null ? (
          <div className="flex justify-center py-8">
            <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {wallets.map((w) => (
              <button
                key={w.id}
                type="button"
                disabled={step !== null}
                onClick={() => void link(w)}
                className="flex items-center gap-3 rounded-2xl bg-white/5 p-3 text-left transition-colors hover:bg-white/10 disabled:opacity-60"
              >
                <WalletLogo icon={w.icon} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-fg">{w.name}</span>
                  <span className="block text-[11px] text-fg-3">{step?.id === w.id ? step.text : "Detected"}</span>
                </span>
                <ChainDot chain={w.chain} />
              </button>
            ))}
            {wallets.length === 0 && <p className="py-2 text-sm text-fg-2">No wallet extension found in this browser.</p>}
            {missing.length > 0 && (
              <>
                <p className="mt-3 mb-1 text-[11px] text-fg-3 uppercase">Not installed</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {missing.map((k) => (
                    <a
                      key={k.name}
                      href={k.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/5 px-3 py-2 text-xs text-fg-2 hover:text-fg"
                    >
                      {k.name}
                      <Icon icon={ArrowUpRight01Icon} size={12} className="ml-auto" />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
        {error && (
          <div className="mt-3">
            <FieldError>{error}</FieldError>
          </div>
        )}
        <Button variant="ghost" size="sm" className="mt-3 w-full text-fg-3" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

function WalletLogo({ icon }: { icon: string | null }) {
  return (
    <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white/10">
      {/* Wallet icons are data URIs announced by the extension. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {icon ? <img src={icon} alt="" className="size-full" /> : <Icon icon={Wallet01Icon} size={18} className="text-fg-2" />}
    </span>
  );
}
