"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { canonicalZone, clockCountries, countryZones, localTimeZone, resolveClock, zoneCity, zoneCountry } from "@fl3x/shared";
import { Flag, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { inputClass } from "./Field";

/** Clock place: a country (with its flag), then one of that country's zones. */

type Country = { id: string; name: string };

let countriesCache: Country[] | null = null;
function countries(): Country[] {
  if (countriesCache) return countriesCache;
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region" });
  } catch {}
  countriesCache = clockCountries()
    .map((c) => ({ id: c.id, name: names?.of(c.id) ?? c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
  return countriesCache;
}

const fold = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function offsetLabel(tz: string) {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "shortOffset" }).formatToParts(new Date()).find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}

/** Minutes east of UTC right now, to sort a country's zones west → east. */
function offsetMinutes(tz: string) {
  const m = offsetLabel(tz).match(/GMT([+-])(\d+)(?::(\d+))?/);
  return m ? (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3] ?? 0)) : 0;
}

export function CountryPicker({ settings, onChange }: { settings: Record<string, unknown>; onChange: (v: string) => void }) {
  const current = resolveClock(settings).country;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const box = useRef<HTMLDivElement>(null);
  const all = useMemo(countries, []);
  const local = useMemo(() => {
    const tz = localTimeZone();
    return tz ? zoneCountry(tz) : undefined;
  }, []);

  const list = useMemo(() => {
    const q = fold(query.trim());
    if (q) return all.filter((c) => fold(c.name).includes(q) || c.id.toLowerCase() === q);
    // The member's own country first, then everything by name.
    const mine = all.find((c) => c.id === local);
    return mine ? [mine, ...all.filter((c) => c !== mine)] : all;
  }, [all, query, local]);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, [open]);

  const pick = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };
  const name = all.find((c) => c.id === current)?.name;

  return (
    <div ref={box}>
      <button type="button" onClick={() => setOpen((o) => !o)} className={cn(inputClass, "flex items-center gap-2 text-left")}>
        {current && <Flag country={current} className="size-5 shrink-0 rounded-full" />}
        <span className={cn("min-w-0 flex-1 truncate", !name && "text-fg-3")}>{name ?? "Pick your country"}</span>
        <Icon icon={ArrowDown01Icon} size={16} className={cn("shrink-0 text-fg-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-[#111]">
          <div className="relative border-b border-white/10">
            <Icon icon={Search01Icon} size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-fg-3" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && list[0]) {
                  e.preventDefault();
                  pick(list[0].id);
                }
                if (e.key === "Escape") setOpen(false);
              }}
              placeholder="Search a country"
              className="h-10 w-full bg-transparent pr-3 pl-9 text-sm text-fg outline-none placeholder:text-fg-3"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {list.length === 0 && <p className="px-3 py-2 text-xs text-fg-3">No country found</p>}
            {list.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => pick(c.id)}
                className={cn("flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-white/5", c.id === current ? "text-brand" : "text-fg-2")}
              >
                <Flag country={c.id} className="size-5 shrink-0 rounded-full" />
                <span className="truncate">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** One zone: set from the country. Several: only that country's, by city. */
export function ZonePicker({ settings, countryKey, onChange }: { settings: Record<string, unknown>; countryKey: string; onChange: (v: string) => void }) {
  const { timezone, country } = resolveClock({ timezone: settings.timezone, country: settings[countryKey] });
  const zones = useMemo(() => {
    if (!country) return [];
    return countryZones(country)
      .map((tz) => ({ tz, city: zoneCity(tz), offset: offsetLabel(tz), minutes: offsetMinutes(tz) }))
      .sort((a, b) => a.minutes - b.minutes || a.city.localeCompare(b.city));
  }, [country]);

  if (!country) return <p className="rounded-xl border border-dashed border-white/15 px-3 py-2.5 text-xs text-fg-3">Pick your country first</p>;
  if (zones.length <= 1) {
    return (
      <p className="flex h-10 items-center justify-between rounded-xl border border-white/10 bg-[#111]/50 px-3 text-sm text-fg-2">
        {zoneCity(timezone)} <span className="text-xs text-fg-3">{offsetLabel(timezone)} · set from the country</span>
      </p>
    );
  }
  // A saved link (US/Pacific) shows as the zone it points to.
  const value = zones.find((z) => canonicalZone(z.tz) === canonicalZone(timezone))?.tz ?? zones[0]?.tz ?? timezone;
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      {zones.map((z) => (
        <option key={z.tz} value={z.tz}>
          {z.city} · {z.offset}
        </option>
      ))}
    </select>
  );
}

/**
 * The city shown on the card. A new country or zone empties it (no "Dubai"
 * under a US flag); the zone's city shows until the member types one.
 */
export function CityInput({
  settings,
  value,
  timezoneKey,
  countryKey,
  max,
  onChange,
}: {
  settings: Record<string, unknown>;
  value: string;
  timezoneKey: string;
  countryKey: string;
  max?: number;
  onChange: (v: string | undefined) => void;
}) {
  const { timezone, country } = resolveClock({ timezone: settings[timezoneKey], country: settings[countryKey] });
  const place = `${country ?? ""}|${canonicalZone(timezone)}`;
  const prev = useRef({ place, value });
  useEffect(() => {
    const before = prev.current;
    prev.current = { place, value };
    // Only when the place moved on its own: a Discard (or another widget) changes the city too.
    if (before.place !== place && before.value === value && value) onChange(undefined);
  }, [place, value, onChange]);
  return <input type="text" className={inputClass} maxLength={max} placeholder={zoneCity(timezone)} value={value} onChange={(e) => onChange(e.target.value)} />;
}
