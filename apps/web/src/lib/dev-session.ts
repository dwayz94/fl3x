import { site } from "@/config/site";

export const DEV_KEY = "fl3x:dev-user";

/** Local test sessions only (see /dev): the name behind the "dev:<name>" token. */
export const devSession = {
  // Without Privy, or alongside it with NEXT_PUBLIC_DEV_LOGIN=1. Never in production.
  enabled: process.env.NODE_ENV !== "production" && (!site.privyAppId || process.env.NEXT_PUBLIC_DEV_LOGIN === "1"),
  set: (name: string) => localStorage.setItem(DEV_KEY, name),
  current: () => localStorage.getItem(DEV_KEY),
  clear: () => localStorage.removeItem(DEV_KEY),
};
