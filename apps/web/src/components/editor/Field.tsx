"use client";

import { useMemo } from "react";
import type { FieldDef } from "@fl3x/shared";
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
}: {
  def: FieldDef;
  value: string | number | undefined;
  onChange: (v: string | number | undefined) => void;
  wallets: string[];
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
    case "wallet":
      control = wallets.length ? (
        <select className={inputClass} value={str} onChange={(e) => onChange(e.target.value)}>
          <option value="">Choose a wallet</option>
          {wallets.map((w) => (
            <option key={w} value={w}>
              {shortAddress(w)}
            </option>
          ))}
        </select>
      ) : (
        <p className="rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-xs text-fg-3">Link a wallet in Settings to display it</p>
      );
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
