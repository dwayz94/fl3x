"use client";

import { useMemo } from "react";
import type { FieldDef, LinkedWallet } from "@fl3x/shared";
import { ImageInput } from "@/components/ui";
import { shortAddress } from "@/lib/format";
import { cn } from "@/lib/cn";

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

export function Segmented({ options, value, onChange }: { options: readonly { id: string; label: string }[]; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-[#111] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn("flex-1 rounded-lg py-1.5 text-xs transition-colors", value === o.id ? "bg-brand text-bg" : "text-fg-2 hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Field({
  def,
  value,
  onChange,
  wallets,
  settings,
}: {
  def: FieldDef;
  settings: Record<string, unknown>;
  value: string | number | undefined;
  onChange: (v: string | number | undefined) => void;
  wallets: LinkedWallet[];
}) {
  const timezones = useMemo(() => (def.kind === "timezone" ? Intl.supportedValuesOf("timeZone") : []), [def.kind]);
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
      control = <Segmented options={def.options} value={str || def.default} onChange={onChange} />;
      break;
    case "wallets":
      control = <WalletsPicker value={str || def.default} onChange={onChange} wallets={wallets} />;
      break;
    case "timezone":
      control = (
        <select className={inputClass} value={str || "UTC"} onChange={(e) => onChange(e.target.value)}>
          {timezones.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      );
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
          maxLength={def.max}
          placeholder={def.placeholder}
          value={str}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }

  return (
    <div className="border-b border-dashed border-white/10 pb-5">
      <Label>{def.label}</Label>
      {control}
    </div>
  );
}

/** "All wallets" (default, follows future links) or a hand-picked set. */
function WalletsPicker({ value, onChange, wallets }: { value: string; onChange: (v: string) => void; wallets: LinkedWallet[] }) {
  if (wallets.length === 0) {
    return <p className="rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-xs text-fg-3">Link a wallet in Settings to display it</p>;
  }
  const all = value === "all";
  const picked = new Set(all ? wallets.map((w) => w.address) : value.split(",").filter(Boolean));
  const toggle = (address: string) => {
    const next = new Set(picked);
    if (next.has(address)) next.delete(address);
    else next.add(address);
    onChange(next.size === wallets.length ? "all" : [...next].join(","));
  };
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn("flex items-center justify-between rounded-xl border px-3 py-2 text-xs", all ? "border-brand bg-brand/10 text-fg" : "border-white/10 bg-[#111] text-fg-2")}
      >
        All my wallets <span className="text-fg-3">{wallets.length} combined</span>
      </button>
      {wallets.map((w) => (
        <label key={w.id} className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/10 bg-[#111] px-3 py-2 text-xs">
          <input type="checkbox" checked={picked.has(w.address)} onChange={() => toggle(w.address)} className="accent-brand" />
          <ChainDot chain={w.chain} />
          <span className="font-mono text-fg-2">{shortAddress(w.address)}</span>
        </label>
      ))}
    </div>
  );
}

export function ChainDot({ chain }: { chain: LinkedWallet["chain"] }) {
  return (
    <span className={cn("rounded-md px-1.5 py-0.5 text-[9px] font-normal uppercase", chain === "solana" ? "bg-[#9945FF]/25 text-[#C9A8FF]" : "bg-[#627EEA]/25 text-[#AFC0FF]")}>
      {chain === "solana" ? "SOL" : "EVM"}
    </span>
  );
}
