"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { PrivyProvider, useLinkWithOAuth, useLoginWithOAuth, usePrivy } from "@privy-io/react-auth";
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
          // Any wallet can sign in; the $FL3X token (tiers) lives on Solana.
          walletChainType: "ethereum-and-solana",
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
  // X sign-in skips the Privy modal: the button goes straight to X's authorize page,
  // and these hooks (mounted on every signed-in page) finish the flow when X sends the user back.
  const { initOAuth: loginWithX, state: xState } = useLoginWithOAuth();
  const { initOAuth: linkX } = useLinkWithOAuth();
  const queryClient = useQueryClient();
  const synced = useRef<string | null>(null);

  // Coming back from X (?privy_oauth_code=…): Privy needs a moment to finish the sign-in. Until it does
  // (or fails, or 20 s pass), pages show "Confirming with X" instead of the sign-in button again.
  const [returning, setReturning] = useState(false);
  useEffect(() => {
    if (!/[?&]privy_oauth_(code|state)=/.test(window.location.search)) return;
    setReturning(true);
    const t = setTimeout(() => setReturning(false), 20_000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (privy.authenticated || xState.status === "error") setReturning(false);
  }, [privy.authenticated, xState.status]);
  const pending = !privy.authenticated && (returning || xState.status === "loading");

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
      pending,
      login: (opts) => (opts?.xOnly ? void loginWithX({ provider: "twitter" }).catch(() => {}) : privy.login()),
      logout: async () => {
        await privy.logout();
        synced.current = null;
        queryClient.removeQueries({ queryKey: ["me"] });
      },
      linkTwitter: () => void linkX({ provider: "twitter" }).catch(() => {}),
      getToken: () => privy.getAccessToken(),
    }),
    [privy, queryClient, loginWithX, linkX, pending],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
