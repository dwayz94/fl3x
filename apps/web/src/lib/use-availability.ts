"use client";

import { useEffect, useState } from "react";
import { validateUsername } from "@fl3x/shared";
import { api } from "./api";

export type Availability = { available: boolean; reason: string | null };

/** Live username check: local rules first, then the API, debounced. */
export function useAvailability(username: string) {
  const [state, setState] = useState<Availability | "checking" | null>(null);
  useEffect(() => {
    setState(null);
    if (!username) return;
    const local = validateUsername(username);
    if (!local.valid) return setState({ available: false, reason: local.message });
    setState("checking");
    const t = setTimeout(() => {
      api<Availability>(`/usernames/${encodeURIComponent(username)}`).then(setState).catch(() => setState(null));
    }, 300);
    return () => clearTimeout(t);
  }, [username]);
  return state;
}
