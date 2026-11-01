/** Session /admin hands out to build a reserved profile. This tab only. */
const KEY = "fl3x:team";
/** Where the team page was opened (its address can be secret, see proxy.ts), to come back to it. */
const ADMIN_PATH_KEY = "fl3x:admin-path";

export const teamSession = {
  get(): { token: string; username: string } | null {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as { token: string; username: string }) : null;
    } catch {
      return null;
    }
  },
  set(value: { token: string; username: string }) {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(value));
    } catch {}
  },
  adminPath(): string | null {
    try {
      return sessionStorage.getItem(ADMIN_PATH_KEY);
    } catch {
      return null;
    }
  },
  rememberAdminPath(path: string) {
    try {
      sessionStorage.setItem(ADMIN_PATH_KEY, path);
    } catch {}
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
    } catch {}
  },
};
