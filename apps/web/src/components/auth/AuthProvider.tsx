"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Me } from "@fl3x/shared";
import { site } from "@/config/site";
import { api } from "@/lib/api";
import { DEV_KEY, devSession } from "@/lib/dev-session";
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


/** Public profiles don't sign anyone in: no Privy there, the page stays light. */
const PrivyAuth = dynamic(() => import("./PrivyAuth"));

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }), []);
  const pathname = usePathname();
  const publicProfile = pathname.startsWith("/u/") || pathname.startsWith("/@");

  return (
    <QueryClientProvider client={queryClient}>
      {publicProfile ? (
        children
      ) : site.privyAppId && !devSession.enabled ? (
        <PrivyAuth>{children}</PrivyAuth>
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
