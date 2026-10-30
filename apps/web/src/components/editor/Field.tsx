"use client";

import { useState } from "react";
import { addressNetwork, premiumLocked, type FieldDef, type LinkedWallet } from "@fl3x/shared";
import { ImageInput } from "@/components/ui";
import { CityInput, CountryPicker, ZonePicker } from "./ClockPlace";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";
import { ChainTile, CHAINS } from "@/components/wallet/chain";
import { ConnectWalletModal } from "@/components/wallet/ConnectWalletModal";
import { EmptyWallets, LinkWalletButton } from "@/components/wallet/LinkWallet";

export const inputClass =
  "h-10 w-full rounded-xl border border-white/10 bg-[#111] px-3 text-sm text-fg outline-none transition-colors placeholder:text-fg-3 focus:border-brand";

export function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-sm text-fg-2">{children}</p>;
}

/** ISO string → value for <input type="datetime-local"> in the viewer's zone. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function Segmented({ options, value, onChange }: { options: readonly { id: string; label: string; disabled?: boolean }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-[#111] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          disabled={o.disabled}
          title={o.disabled ? "Not included in your tier" : undefined}
          onClick={() => onChange(o.id)}
          className={cn("flex-1 rounded-lg py-1.5 text-xs transition-colors disabled:cursor-not-allowed disabled:opacity-30", value === o.id ? "bg-brand text-bg" : "text-fg-2 hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A wallets field's family: fixed ("solana" / "evm") or read from another field (default Solana). */
const walletNetwork = (network: string, settings: Record<string, unknown>) =>
  network === "solana" || network === "evm" ? network : settings[network] === "evm" ? "evm" : "solana";

export function Field({
  def,
  value,
  onChange,
  wallets,
  settings,
  premium = true,
}: {
  def: FieldDef;
  settings: Record<string, unknown>;
  /** The member is Premium: Premium-only fields and options are unlocked. */
  premium?: boolean;
  value: string | number | undefined;
  onChange: (v: string | number | undefined) => void;
  wallets: LinkedWallet[];
}) {
  const str = value === undefined ? "" : String(value);

  let control: React.ReactNode;
  switch (def.kind) {
    case "textarea":
      control = <textarea className={cn(inputClass, "h-20 resize-none py-2")} maxLength={def.max} placeholder={def.placeholder} value={str} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "number":
      control = (
        <input
          type="number"
          className={inputClass}
          min={def.min}
          max={def.max}
          value={str}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
        />
      );
      break;
    case "select":
      control = (
        <select className={inputClass} value={str || def.default} onChange={(e) => onChange(e.target.value)}>
          {def.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.label}
            </option>
          ))}
        </select>
      );
      break;
    case "segmented":
      control = (
        <Segmented
          // Premium-only options (a color background…) stay visible but locked.
          options={def.options.map((o) => ({ ...o, disabled: !premium && premiumLocked(def, o.id), label: !premium && premiumLocked(def, o.id) ? `${o.label} · Premium` : o.label }))}
          value={str || def.default}
          onChange={onChange}
        />
      );
      break;
    case "wallets":
      control = (
        <WalletsPicker
          value={str || def.default}
          onChange={onChange}
          // Limited to the widget's network when it has one (P&L: Solana or EVM).
          wallets={def.network ? wallets.filter((w) => addressNetwork(w.address) === walletNetwork(def.network!, settings)) : wallets}
        />
      );
      break;
    case "country":
      control = <CountryPicker settings={settings} onChange={onChange} />;
      break;
    case "timezone":
      control = <ZonePicker settings={settings} countryKey={def.country} onChange={onChange} />;
      break;
    case "city":
      control = <CityInput settings={settings} value={str} timezoneKey={def.timezone} countryKey={def.country} max={def.max} onChange={onChange} />;
      break;
    case "datetime":
      control = (
        <input
          type="datetime-local"
          className={cn(inputClass, "[color-scheme:dark]")}
          value={str ? toLocalInput(str) : ""}
          onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
        />
      );
      break;
    case "color":
      control = (
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-[#111] p-2">
          <input type="color" value={str || def.default} onChange={(e) => onChange(e.target.value.toUpperCase())} className="size-8 cursor-pointer rounded-lg border-0 bg-transparent" />
          <span className="font-mono text-xs text-fg-2">{str || def.default}</span>
        </div>
      );
      break;
    case "image":
      control = <ImageInput kind="widget" value={str} onChange={onChange} />;
      break;
    case "handle": {
      const platform = String(settings[def.from] ?? Object.keys(def.prefixes)[0]);
      const prefix = def.prefixes[platform] ?? "";
      control = (
        <div className={cn(inputClass, "flex items-center")}>
          <span className="shrink-0 text-fg-3">{prefix}</span>
          <input
            className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3"
            placeholder="handle"
            value={str}
            spellCheck={false}
            autoCapitalize="none"
            // A pasted full link keeps only what comes after the domain.
            onChange={(e) => onChange(e.target.value.trim().replace(/^(https?:\/\/)?(www\.)?/, "").replace(prefix, "").replace(/^@/, "").replace(/\/$/, ""))}
          />
        </div>
      );
      break;
    }
    case "range": {
      const v = typeof value === "number" ? value : def.default;
      control = (
        <div className="flex items-center gap-3">
          <input type="range" min={def.min} max={def.max} value={v} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 accent-brand" />
          <span className="w-10 text-right text-xs text-fg-2">{v}%</span>
        </div>
      );
      break;
    }
    default:
      control = (
        <input
          type={def.kind === "url" ? "url" : "text"}
          className={inputClass}
          maxLength={"max" in def ? def.max : 500}
          placeholder={def.placeholder}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className="border-b border-dashed border-white/10 pb-5">
      <Label>{def.label}</Label>
      {!premium && def.premium === true ? <p className="text-xs text-fg-3">Premium only.</p> : control}
    </div>
  );
}

/** "All wallets" (default, follows future links) or a hand-picked set, and linking a new one right here. */
function WalletsPicker({ value, onChange, wallets }: { value: string; onChange: (v: string) => void; wallets: LinkedWallet[] }) {
  const [open, setOpen] = useState(false);
  const all = value === "all";
  const picked = new Set(all ? wallets.map((w) => w.address) : value.split(",").filter(Boolean));
  const toggle = (address: string) => {
    const next = new Set(picked);
    if (next.has(address)) next.delete(address);
    else next.add(address);
    onChange(next.size === wallets.length ? "all" : [...next].join(","));
  };
  // A hand-picked set gets the new wallet too: it was linked for this widget.
  const onLinked = (_me: unknown, address: string) => {
    if (!all) onChange([...picked, address].join(","));
  };
  const modal = <ConnectWalletModal open={open} onClose={() => setOpen(false)} onLinked={onLinked} />;

  if (wallets.length === 0) {
    return (
      <>
        <EmptyWallets compact onLink={() => setOpen(true)} />
        {modal}
      </>
    );
  }
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn("flex h-10 items-center justify-between rounded-xl border px-3 text-xs transition-colors", all ? "border-brand bg-brand/10 text-fg" : "border-white/10 bg-[#111] text-fg-2 hover:text-fg")}
      >
        All my wallets <span className="text-fg-3">{wallets.length} combined</span>
      </button>
      {wallets.map((w) => (
        <label key={w.id} className="flex h-11 cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-[#111] px-2 text-xs transition-colors hover:border-white/20">
          <ChainTile chain={w.chain} size={28} />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-fg">{w.label || `${CHAINS[w.chain].label} wallet`}</span>
            <span className="block font-mono text-[10px] text-fg-3">{shortAddress(w.address)}</span>
          </span>
          <input type="checkbox" checked={picked.has(w.address)} onChange={() => toggle(w.address)} className="size-4 accent-brand" />
        </label>
      ))}
      <LinkWalletButton onClick={() => setOpen(true)} />
      {modal}
    </div>
  );
}
