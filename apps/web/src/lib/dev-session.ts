import { site } from "@/config/site";

export const DEV_KEY = "fl3x:dev-user";

/** Local test sessions only (see /dev): the name behind the "dev:<name>" token. */
export const devSession = {
  enabled: !site.privyAppId && process.env.NODE_ENV !== "production",
  set: (name: string) => localStorage.setItem(DEV_KEY, name),
  current: () => localStorage.getItem(DEV_KEY),
  clear: () => localStorage.removeItem(DEV_KEY),
};
