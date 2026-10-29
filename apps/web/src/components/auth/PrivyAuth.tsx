"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";
import { PrivyProvider, usePrivy } from "@privy-io/react-auth";
import { toSolanaWalletConnectors } from "@privy-io/react-auth/solana";
import { useQueryClient } from "@tanstack/react-query";
import type { Me } from "@fl3x/shared";
import { site } from "@/config/site";
import { api } from "@/lib/api";
import { AuthContext, type AuthState } from "./auth-context";

/**
 * Privy and its wallet connectors, in their own chunk: loaded by the pages
 * that sign people in, never by public profiles.
 */
const solanaConnectors = toSolanaWalletConnectors();

export default function PrivyAuth({ children }: { children: ReactNode }) {
  return (
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
      login: (opts) => privy.login(opts?.xOnly ? { loginMethods: ["twitter"] } : undefined),
      logout: async () => {
        await privy.logout();
        synced.current = null;
        queryClient.removeQueries({ queryKey: ["me"] });
      },
      linkTwitter: () => privy.linkTwitter(),
      getToken: () => privy.getAccessToken(),
    }),
    [privy, queryClient],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
