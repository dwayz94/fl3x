/** "2026-10-31" → "October 31, 2026", the same on the server and in the browser. */
export const fmtDate = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" });
