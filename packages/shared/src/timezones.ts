import { getAllCountries, getCountry, getTimezone } from "countries-and-timezones";

/**
 * Country → time zones, for the Clock widget. The member picks a country,
 * then (only when it spans several zones) one of that country's zones, so
 * the time always belongs to the flag.
 */

/** Zone the clock falls back to when a country spans several and none fits. */
const MAIN_ZONE: Record<string, string> = {
  AR: "America/Argentina/Buenos_Aires", AU: "Australia/Sydney", BR: "America/Sao_Paulo", CA: "America/Toronto",
  CD: "Africa/Kinshasa", CL: "America/Santiago", CN: "Asia/Shanghai", CY: "Asia/Nicosia", DE: "Europe/Berlin",
  EC: "America/Guayaquil", ES: "Europe/Madrid", FM: "Pacific/Pohnpei", GL: "America/Nuuk", ID: "Asia/Jakarta",
  KI: "Pacific/Tarawa", KZ: "Asia/Almaty", MH: "Pacific/Majuro", MN: "Asia/Ulaanbaatar", MX: "America/Mexico_City",
  MY: "Asia/Kuala_Lumpur", NZ: "Pacific/Auckland", PF: "Pacific/Tahiti", PG: "Pacific/Port_Moresby", PS: "Asia/Gaza",
  PT: "Europe/Lisbon", RU: "Europe/Moscow", US: "America/New_York", UZ: "Asia/Tashkent",
};

/** The zone a link points to ("Asia/Calcutta" → "Asia/Kolkata"). */
export const canonicalZone = (tz: string) => getTimezone(tz)?.aliasOf ?? tz;
const canonical = canonicalZone;
const zonesCache = new Map<string, string[]>();

/**
 * The zones a country owns, one per distinct zone: links are kept under the
 * country's own city name (Oman gets Asia/Muscat, not Asia/Dubai).
 */
export function countryZones(code: string): string[] {
  const c = code.toUpperCase();
  const hit = zonesCache.get(c);
  if (hit) return hit;
  const country = getCountry(c, { deprecated: true });
  if (!country) return [];
  const own = country.timezones.filter((z) => getTimezone(z)?.countries[0] === c);
  const out: string[] = [];
  const seen = new Set<string>();
  // Current names first, so a deprecated spelling only stays when it's the country's only name.
  for (const z of [...own].sort((a, b) => Number(!!getTimezone(a)?.deprecated) - Number(!!getTimezone(b)?.deprecated))) {
    if (seen.has(canonical(z))) continue;
    seen.add(canonical(z));
    out.push(z);
  }
  const zones = out.length ? out.sort() : (getCountry(c)?.timezones ?? []);
  zonesCache.set(c, zones);
  return zones;
}

/** Every country with at least one time zone, by name. */
export function clockCountries(): { id: string; name: string }[] {
  return Object.values(getAllCountries())
    .filter((c) => countryZones(c.id).length > 0)
    .map((c) => ({ id: c.id, name: c.name }));
}

export function isCountryCode(code: unknown): code is string {
  return typeof code === "string" && /^[A-Za-z]{2}$/.test(code) && countryZones(code).length > 0;
}

/** The country a zone belongs to ("Asia/Dubai" → "AE"). */
export function zoneCountry(tz: string): string | undefined {
  return getTimezone(tz)?.countries[0];
}

export function zoneInCountry(tz: string, country: string): boolean {
  const c = canonical(tz);
  return countryZones(country).some((z) => canonical(z) === c);
}

export function mainZone(country: string): string | undefined {
  const zones = countryZones(country);
  const main = MAIN_ZONE[country.toUpperCase()];
  return main && zones.includes(main) ? main : zones[0];
}

/** "America/Argentina/Buenos_Aires" → "Buenos Aires" */
export function zoneCity(tz: string): string {
  return (tz.split("/").pop() ?? tz).replace(/_/g, " ");
}

/**
 * Clock settings as shown and saved: the country wins, the zone is kept only
 * when it belongs to it. Older clocks without a country get the zone's.
 */
export function resolveClock(settings: { timezone?: unknown; country?: unknown }): { timezone: string; country?: string } {
  let tz = typeof settings.timezone === "string" && getTimezone(settings.timezone) ? settings.timezone : undefined;
  let country = isCountryCode(settings.country) ? settings.country.toUpperCase() : undefined;
  if (!country && tz) country = zoneCountry(tz);
  if (country && !(tz && zoneInCountry(tz, country))) tz = mainZone(country);
  return { timezone: tz ?? "UTC", country };
}

/** The browser's zone, for new clocks (undefined on the server). */
export function localTimeZone(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz && getTimezone(tz) ? tz : undefined;
  } catch {
    return undefined;
  }
}
