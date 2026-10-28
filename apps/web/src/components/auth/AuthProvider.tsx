"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { QueryClient, QueryClientProvider, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Me } from "@fl3x/shared";
import { site } from "@/config/site";
import { api } from "@/lib/api";

interface AuthState {
  configured: boolean;
  ready: boolean;
  authenticated: boolean;
  login: () => void;
  logout: () => Promise<void>;
  linkTwitter: () => void;
  linkWallet: () => void;
  getToken: () => Promise<string | null>;
}

const noop = () => {
  console.warn("Privy is not configured: set NEXT_PUBLIC_PRIVY_APP_ID");
};

const AuthContext = createContext<AuthState>({
  configured: false,
  ready: true,
  authenticated: false,
  login: noop,
  logout: async () => {},
  linkTwitter: noop,
  linkWallet: noop,
  getToken: async () => null,
});

const DEV_KEY = "fl3x:dev-user";

/**
 * Local dev without a Privy app id: a prompt asks for a name and the API
 * accepts "dev:<name>" tokens. The API refuses these in production.
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
        const name = window.prompt("Dev login (no Privy configured). Pick a name:", "dev")?.toLowerCase().replace(/[^a-z0-9_]/g, "");
        if (name && name.length >= 2) {
          localStorage.setItem(DEV_KEY, name);
          setUser(name);
        }
      },
      logout: async () => {
        localStorage.removeItem(DEV_KEY);
        setUser(null);
        queryClient.clear();
      },
      linkTwitter: noop,
      linkWallet: noop,
      getToken: async () => (user ? `dev:${user}` : null),
    }),
    [ready, user, queryClient],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

const solanaConnectors = toSolanaWalletConnectors();

export function Providers({ children }: { children: ReactNode }) {
  const queryClient = useMemo(() => new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: 1 } } }), []);

  return (
    <QueryClientProvider client={queryClient}>
      {site.privyAppId ? (
        <PrivyProvider
          appId={site.privyAppId}
          config={{
            loginMethods: ["twitter", "wallet"],
            appearance: {
              theme: "dark",
              accentColor: "#FF97CB",
              logo: `${site.url}/images/fl3x-logo.svg`,
              landingHeader: "Sign in to FL3X",
              walletChainType: "solana-only",
            },
            externalWallets: { solana: { connectors: solanaConnectors } },
            embeddedWallets: { solana: { createOnLogin: "off" }, ethereum: { createOnLogin: "off" } },
          }}
        >
          <PrivyBridge>{children}</PrivyBridge>
        </PrivyProvider>
      ) : process.env.NODE_ENV !== "production" ? (
        <DevAuth>{children}</DevAuth>
      ) : (
        children
      )}
    </QueryClientProvider>
  );
}

function PrivyBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy();
  const queryClient = useQueryClient();
  const synced = useRef<string | null>(null);

  // Sync linked accounts (X handle, wallets) to our API whenever they change.
  const accountsKey = privy.user?.linkedAccounts.map((a) => a.type + ("address" in a ? a.address : "")).join(",") ?? "";
  useEffect(() => {
    if (!privy.authenticated || synced.current === accountsKey) return;
    synced.current = accountsKey;
    void privy.getAccessToken().then(async (token) => {
      const me = await api<Me>("/session", { method: "POST", token });
      queryClient.setQueryData(["me"], me);
    });
  }, [privy.authenticated, accountsKey, privy, queryClient]);

  const value = useMemo<AuthState>(
    () => ({
      configured: true,
      ready: privy.ready,
      authenticated: privy.authenticated,
      login: () => privy.login(),
      logout: async () => {
        await privy.logout();
        synced.current = null;
        queryClient.removeQueries({ queryKey: ["me"] });
      },
      linkTwitter: () => privy.linkTwitter(),
      linkWallet: () => privy.linkWallet({ walletChainType: "solana-only" }),
      getToken: () => privy.getAccessToken(),
    }),
    [privy, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useMe() {
  const { authenticated, getToken } = useAuth();
  return useQuery({
    queryKey: ["me"],
    enabled: authenticated,
    queryFn: async () => api<Me>("/me", { token: await getToken() }),
  });
}
