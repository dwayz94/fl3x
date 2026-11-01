"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Me } from "@fl3x/shared";
import { api } from "@/lib/api";
import { teamSession } from "@/lib/team-session";
import { AuthContext, noop, type AuthState } from "./auth-context";

/**
 * The dashboard, signed in as a profile the team is building ahead for
 * someone (session handed out by /admin, kept for this tab only).
 */
export default function TeamAuth({ session, children }: { session: { token: string; username: string }; children: ReactNode }) {
  const queryClient = useQueryClient();
  // Drop anything cached for the founder's own account first, then mount the dashboard on this one.
  const [cleared, setCleared] = useState(false);
  useEffect(() => {
    queryClient.clear();
    setCleared(true);
    void api<Me>("/session", { method: "POST", token: session.token });
  }, [session.token, queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      configured: true,
      ready: true,
      authenticated: true,
      pending: false,
      login: noop,
      logout: async () => {
        teamSession.clear();
        window.location.href = teamSession.adminPath() ?? "/";
      },
      linkTwitter: noop,
      getToken: async () => session.token,
    }),
    [session.token],
  );

  return (
    <AuthContext.Provider value={value}>
      {cleared && children}
      <div className="fixed bottom-4 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-3 rounded-full bg-brand py-2 pr-2 pl-4 text-sm text-black shadow-lg">
        Building @{session.username} for its owner
        <button type="button" onClick={() => void value.logout()} className="rounded-full bg-black px-3 py-1 text-white">
          Exit
        </button>
      </div>
    </AuthContext.Provider>
  );
}
