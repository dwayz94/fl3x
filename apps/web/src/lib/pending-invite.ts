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

// Username picked before signing in, claimed right after the OAuth round-trip.
const USERNAME_KEY = "fl3x:username";

export function savePendingUsername(username: string) {
  try { localStorage.setItem(USERNAME_KEY, username.trim().toLowerCase()); } catch {}
}

export function readPendingUsername(): string {
  try { return localStorage.getItem(USERNAME_KEY) ?? ""; } catch { return ""; }
}

export function clearPendingUsername() {
  try { localStorage.removeItem(USERNAME_KEY); } catch {}
}
