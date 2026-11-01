"use client";

import { useEffect, useState } from "react";
import type { Me } from "@fl3x/shared";
import { api } from "./api";
import { devSession } from "./dev-session";

/**
 * The session token already in this browser, without loading Privy (public
 * profiles skip it to stay light): Privy keeps its access token in local
 * storage, the dev login keeps a name.
 */
export function storedToken(): string | null {
  try {
    if (devSession.enabled) {
      const dev = devSession.current();
      if (dev) return `dev:${dev}`;
    }
    const raw = localStorage.getItem("privy:token");
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

/** True when the signed-in member is looking at their own profile. */
export function useIsOwner(username: string) {
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    const token = storedToken();
    if (!token) return;
    let cancelled = false;
    // An expired token just means no button; the dashboard refreshes it.
    api<Me>("/me", { token })
      .then((me) => !cancelled && setOwner(me.username === username.toLowerCase()))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [username]);
  return owner;
}
