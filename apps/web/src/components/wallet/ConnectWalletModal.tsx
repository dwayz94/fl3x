"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft01Icon, ArrowUpRight01Icon, Cancel01Icon, CheckmarkCircle02Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import type { Me } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { Button, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { shortAddress } from "@/lib/format";
import { detectWallets, isMobileBrowser, KNOWN_WALLETS, type DetectedWallet } from "@/lib/wallet-connect";
import { ChainBadge, WalletLogo } from "./chain";

type Step = "connect" | "sign" | "verify";
type Flow =
  | { wallet: DetectedWallet; step: Step; error?: string }
  | { wallet: DetectedWallet; step: "done"; address: string };

const STEPS: { id: Step; title: string; hint: (name: string) => string }[] = [
  { id: "connect", title: "Connect", hint: (name) => `Approve FL3X in ${name}` },
  { id: "sign", title: "Sign", hint: () => "A free message, no transaction, no gas" },
  { id: "verify", title: "Verify", hint: () => "We check the signature and save the wallet" },
];

const known = (name: string) => KNOWN_WALLETS.find((k) => k.match.test(name));

function errorText(err: unknown, wallet: string) {
  if (err instanceof ApiRequestError) return err.message;
  const code = err && typeof err === "object" && "code" in err ? (err as { code: unknown }).code : null;
  const msg = err instanceof Error ? err.message : "";
  if (code === 4001 || /reject|denied|cancel|declin/i.test(msg)) return `Request cancelled in ${wallet}.`;
  return `${wallet} didn't answer. Unlock it and try again.`;
}

/**
 * Link a wallet to the account: pick a wallet, approve the connection, sign a
 * one-time message, the API checks it. Updates `me` and the wallet widgets' data.
 */
export function ConnectWalletModal({ open, onClose, onLinked }: { open: boolean; onClose: () => void; onLinked?: (me: Me, address: string) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!mounted) return null;

  // Portaled: the editor's panels are transformed, which would trap a fixed overlay.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/75 p-4 sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="connect-wallet-title"
            className="w-full max-w-[400px] rounded-[28px] border border-white/10 bg-[#121212] p-6"
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
          >
            <Body onClose={onClose} onLinked={onLinked} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

function Body({ onClose, onLinked }: { onClose: () => void; onLinked?: (me: Me, address: string) => void }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [wallets, setWallets] = useState<DetectedWallet[] | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [mobile, setMobile] = useState(false);
  // A late wallet answer after the modal closed must not touch state.
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    setMobile(isMobileBrowser());
    void detectWallets().then((w) => alive.current && setWallets(w));
    return () => {
      alive.current = false;
    };
  }, []);

  const link = async (wallet: DetectedWallet) => {
    let step: Step = "connect";
    const set = (s: Step) => {
      step = s;
      if (alive.current) setFlow({ wallet, step: s });
    };
    try {
      set("connect");
      const address = await wallet.connect();
      const token = await getToken();
      const { nonce, message } = await api<{ nonce: string; message: string }>("/me/wallets/challenge", { token, json: { address } });
      set("sign");
      const signature = await wallet.sign(address, message);
      set("verify");
      const me = await api<Me>("/me/wallets", { token, json: { address, nonce, signature } });
      qc.setQueryData(["me"], me);
      // Wallet widgets showing "all my wallets" now include this one.
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
      void qc.invalidateQueries({ queryKey: ["nfts"] });
      onLinked?.(me, address);
      if (alive.current) setFlow({ wallet, step: "done", address });
    } catch (err) {
      if (alive.current) setFlow({ wallet, step, error: errorText(err, wallet.name) });
    }
  };

  if (flow) return <Progress flow={flow} onBack={() => setFlow(null)} onRetry={() => void link(flow.wallet)} onClose={onClose} />;

  const missing = KNOWN_WALLETS.filter((k) => !wallets?.some((w) => k.match.test(w.name)));

  return (
    <>
      <Header title="Link a wallet" subtitle="Solana or EVM (Ethereum, Base, BNB…). Your wallet widgets add them all up." onClose={onClose} />

      {wallets === null ? (
        <div className="flex h-40 items-center justify-center">
          <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
        </div>
      ) : (
        <div className="-mx-1 flex max-h-[min(420px,55svh)] flex-col gap-1.5 overflow-y-auto px-1">
          {wallets.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => void link(w)}
              className="group flex h-14 w-full shrink-0 items-center gap-3 rounded-2xl bg-white/[0.04] px-3 text-left transition-colors hover:bg-white/[0.08]"
            >
              <WalletLogo icon={w.icon ?? known(w.name)?.icon} name={w.name} size={32} />
              <span className="min-w-0 flex-1 truncate text-[15px]">{w.name}</span>
              <ChainBadge chain={w.chain} />
              <span className="rounded-md bg-success/10 px-2 py-1 text-[11px] leading-none text-success">Detected</span>
            </button>
          ))}

          {wallets.length === 0 && (
            <p className="rounded-2xl border border-dashed border-white/10 px-4 py-3 text-sm text-fg-2">
              {mobile ? "Open fl3x.lol in your wallet app's browser to link it." : "No wallet extension found in this browser."}
            </p>
          )}

          {missing.length > 0 && <p className="mt-3 mb-0.5 px-1 text-[11px] text-fg-3">{mobile ? "Open in a wallet app" : "Not installed"}</p>}
          {missing.map((k) => {
            const href = mobile && k.browse ? k.browse(window.location.href) : k.url;
            return (
              <a
                key={k.name}
                href={href}
                target={mobile && k.browse ? undefined : "_blank"}
                rel="noopener noreferrer"
                className="group flex h-12 shrink-0 items-center gap-3 rounded-2xl px-3 transition-colors hover:bg-white/[0.04]"
              >
                <WalletLogo icon={k.icon} name={k.name} size={28} />
                <span className="min-w-0 flex-1 truncate text-sm text-fg-2 group-hover:text-fg">{k.name}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-fg-3 group-hover:text-fg-2">
                  {mobile && k.browse ? "Open app" : "Install"}
                  <Icon icon={ArrowUpRight01Icon} size={12} />
                </span>
              </a>
            );
          })}
        </div>
      )}

      <Footnote />
    </>
  );
}

function Progress({ flow, onBack, onRetry, onClose }: { flow: Flow; onBack: () => void; onRetry: () => void; onClose: () => void }) {
  const { wallet } = flow;
  const done = flow.step === "done";
  const error = flow.step !== "done" ? flow.error : undefined;
  const at = done ? STEPS.length : STEPS.findIndex((s) => s.id === flow.step);

  return (
    <>
      <div className="mb-6 flex items-center justify-between">
        <button type="button" onClick={onBack} disabled={!done && !error} className="flex items-center gap-1 text-sm text-fg-3 transition-colors hover:text-fg disabled:invisible">
          <Icon icon={ArrowLeft01Icon} size={16} />
          Wallets
        </button>
        <CloseButton onClose={onClose} />
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="relative">
          <WalletLogo icon={wallet.icon ?? known(wallet.name)?.icon} name={wallet.name} size={64} />
          {done && (
            <span className="absolute -right-1.5 -bottom-1.5 flex rounded-full bg-[#121212] p-0.5 text-brand">
              <Icon icon={CheckmarkCircle02Icon} size={22} />
            </span>
          )}
        </div>
        <h2 id="connect-wallet-title" className="mt-4 font-primary text-3xl leading-none uppercase">
          {done ? "Wallet linked" : error ? "Not linked" : wallet.name}
        </h2>
        <div className="mt-2 flex items-center gap-2 text-xs text-fg-2">
          <ChainBadge chain={wallet.chain} />
          {done && <span className="font-mono">{shortAddress(flow.address)}</span>}
        </div>
      </div>

      <ol className="mt-6 flex flex-col gap-1">
        {STEPS.map((s, i) => {
          const state = i < at ? "done" : i === at ? (error ? "error" : "active") : "todo";
          return (
            <li key={s.id} className={cn("flex items-center gap-3 rounded-2xl px-3 py-2.5", state === "active" && "bg-white/[0.04]", state === "error" && "bg-danger/10")}>
              <StepDot state={state} n={i + 1} />
              <span className="min-w-0 flex-1">
                <span className={cn("block text-sm", state === "todo" ? "text-fg-3" : "text-fg")}>{s.title}</span>
                {(state === "active" || state === "error") && <span className={cn("block text-[11px]", state === "error" ? "text-danger" : "text-fg-3")}>{state === "error" ? error : s.hint(wallet.name)}</span>}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-6 flex gap-2">
        {done ? (
          <>
            <Button variant="secondary" size="md" className="flex-1" onClick={onBack}>
              Link another
            </Button>
            <Button size="md" className="flex-1" onClick={onClose}>
              Done
            </Button>
          </>
        ) : error ? (
          <>
            <Button variant="secondary" size="md" className="flex-1" onClick={onBack}>
              Other wallet
            </Button>
            <Button size="md" className="flex-1" onClick={onRetry}>
              Try again
            </Button>
          </>
        ) : (
          <p className="w-full text-center text-xs text-fg-3">{flow.step === "verify" ? "Almost there…" : `Check ${wallet.name}, the request is waiting there.`}</p>
        )}
      </div>
    </>
  );
}

function StepDot({ state, n }: { state: "done" | "active" | "error" | "todo"; n: number }) {
  if (state === "done") return <Icon icon={CheckmarkCircle02Icon} size={22} className="shrink-0 text-brand" />;
  if (state === "error") return <Icon icon={Cancel01Icon} size={22} className="shrink-0 rounded-full bg-danger/15 p-1 text-danger" />;
  if (state === "active") return <span className="size-[22px] shrink-0 animate-spin rounded-full border-2 border-brand border-t-transparent" />;
  return <span className="flex size-[22px] shrink-0 items-center justify-center rounded-full border border-white/15 text-[11px] text-fg-3">{n}</span>;
}

function Header({ title, subtitle, onClose }: { title: string; subtitle: string; onClose: () => void }) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 id="connect-wallet-title" className="font-primary text-3xl leading-none uppercase">
          {title}
        </h2>
        <p className="mt-2 text-sm text-fg-2">{subtitle}</p>
      </div>
      <CloseButton onClose={onClose} />
    </div>
  );
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <button type="button" aria-label="Close" onClick={onClose} className="flex size-9 shrink-0 items-center justify-center rounded-xl text-fg-3 transition-colors hover:bg-white/[0.08] hover:text-fg">
      <Icon icon={Cancel01Icon} size={18} />
    </button>
  );
}

function Footnote() {
  return (
    <p className="mt-5 flex items-start gap-2 text-[11px] leading-relaxed text-fg-3">
      <Icon icon={Shield01Icon} size={14} className="mt-px shrink-0" />
      Linking only shares your public address and a free signature. FL3X can never move your funds.
    </p>
  );
}
