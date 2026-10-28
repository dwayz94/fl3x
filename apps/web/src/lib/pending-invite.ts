// Kept in localStorage so the code survives the X OAuth round-trip.
const KEY = "fl3x:invite";

export function savePendingInvite(code: string) {
  try { localStorage.setItem(KEY, code.trim().toUpperCase()); } catch {}
}

export function readPendingInvite(): string {
  try { return localStorage.getItem(KEY) ?? ""; } catch { return ""; }
}

export function clearPendingInvite() {
  try { localStorage.removeItem(KEY); } catch {}
}
