"use client";

import { useEffect, useState } from "react";
import { validateUsername } from "@fl3x/shared";
import { api } from "./api";

/** `error` is set when the API couldn't be reached (not an answer about the name). */
export type Availability = { available: boolean; reason: string | null; error?: true };

/** Live username check: local rules first, then the API, debounced. */
export function useAvailability(username: string) {
  const [state, setState] = useState<Availability | "checking" | null>(null);
  useEffect(() => {
    setState(null);
    if (!username) return;
    const local = validateUsername(username);
    if (!local.valid) return setState({ available: false, reason: local.message });
    setState("checking");
    // A slower answer for an older name must not overwrite the current one.
    let stale = false;
    const t = setTimeout(() => {
      api<Availability>(`/usernames/${encodeURIComponent(username)}`)
        .then((r) => !stale && setState(r))
        .catch(() => !stale && setState({ available: false, reason: "Can't check right now. Try again.", error: true }));
    }, 300);
    return () => {
      stale = true;
      clearTimeout(t);
    };
  }, [username]);
  return state;
}
