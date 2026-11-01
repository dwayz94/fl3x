"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Me } from "@fl3x/shared";
import { site } from "@/config/site";
import { api } from "@/lib/api";
import { DEV_KEY, devSession } from "@/lib/dev-session";
import { teamSession } from "@/lib/team-session";
import { storedToken } from "@/lib/use-owner";
import { AuthContext, noop, useAuth, type AuthState } from "./auth-context";

export { useAuth };

/**
 * Local dev without a Privy app id: /dev hands out test sessions and the
 * API accepts "dev:<name>" tokens. The API refuses these in production.
 */
function DevAuth({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setUser(localStorage.getItem(DEV_KEY));
    setReady(true);
  }, []);
  useEffect(() => {
    if (!user) return;
    void api<Me>("/session", { method: "POST", token: `dev:${user}` }).then((me) => queryClient.setQueryData(["me"], me));
  }, [user, queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      configured: true,
      ready,
      authenticated: Boolean(user),
      pending: false,
      login: () => {
        window.location.href = `/dev?next=${encodeURIComponent(window.location.pathname)}`;
      },
      logout: async () => {
        localStorage.removeItem(DEV_KEY);
        setUser(null);
        queryClient.clear();
      },
      linkTwitter: noop,
          getToken: async () => (user ? `dev:${user}` : null),
    }),
    [ready, user, queryClient],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


/**
 * Marketing pages (landing, blog, help…) only need to know if someone is
 * signed in, for the navbar: the session already stored in this browser,
 * without loading Privy (its SDK is most of the JS). Signing in happens on
 * /join, the dashboard loads Privy and refreshes the token.
 */
function StoredAuth({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    setToken(storedToken());
    setReady(true);
  }, []);
  const value = useMemo<AuthState>(
    () => ({
      configured: true,
      ready,
      authenticated: Boolean(token),
      pending: false,
      login: () => {
        window.location.href = "/join";
      },
      logout: async () => {},
      linkTwitter: noop,
      getToken: async () => token,
    }),
    [ready, token],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Where signing in or the member's own data is needed: Privy loads only there. */
const needsPrivy = (path: string) => path.startsWith("/dashboard") || path.startsWith("/join");

/** Public profiles don't sign anyone in: no Privy there, the page stays light. */
const PrivyAuth = dynamic(() => import("./PrivyAuth"));
/** Only loaded in a tab /admin opened on a reserved profile. */
const TeamAuth = dynamic(() => import("./TeamAuth"));

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }), []);
  const pathname = usePathname();
  const publicProfile = pathname.startsWith("/u/") || pathname.startsWith("/@");
  const [team, setTeam] = useState<{ token: string; username: string } | null>(null);
  useEffect(() => setTeam(teamSession.get()), []);

  return (
    <QueryClientProvider client={queryClient}>
      {publicProfile ? (
        children
      ) : team && pathname.startsWith("/dashboard") ? (
        <TeamAuth session={team}>{children}</TeamAuth>
      ) : site.privyAppId && !devSession.enabled ? (
        needsPrivy(pathname) ? <PrivyAuth>{children}</PrivyAuth> : <StoredAuth>{children}</StoredAuth>
      ) : process.env.NODE_ENV !== "production" ? (
        <DevAuth>{children}</DevAuth>
      ) : (
        children
      )}
    </QueryClientProvider>
  );
}

export function useMe() {
  const { authenticated, getToken } = useAuth();
  return useQuery({
    queryKey: ["me"],
    enabled: authenticated,
    queryFn: async () => api<Me>("/me", { token: await getToken() }),
  });
}
