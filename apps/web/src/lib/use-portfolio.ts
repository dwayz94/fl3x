"use client";

import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PortfolioData, Widget } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "./api";
import { useData, useIsDemo } from "./use-data";

/** Where widgets render: the public profile, or the owner's editor (unsaved widgets, auth). */
export const WidgetHost = createContext<"public" | "editor">("public");

/**
 * Combined value of the wallets behind a P&L / portfolio / holdings widget.
 * Public profiles ask by widget id so addresses never reach the page.
 */
export function usePortfolio(w: Widget, period: string) {
  const host = useContext(WidgetHost);
  const demo = useIsDemo();
  const { getToken } = useAuth();
  const wallets = typeof w.settings.wallets === "string" ? w.settings.wallets : "all";
  // P&L cards count one family of wallets (Solana or EVM); other widgets count them all.
  const network = w.settings.network === "solana" || w.settings.network === "evm" ? w.settings.network : undefined;
  const demoData = useData<PortfolioData>("portfolio", { wallets, period }, demo);
  const live = useQuery({
    queryKey: ["portfolio", host, host === "editor" ? `${wallets}|${network ?? ""}` : `${w.id}|${network ?? ""}`, period],
    enabled: !demo,
    queryFn: async () =>
      host === "editor"
        ? api<PortfolioData>(`/me/portfolio?wallets=${encodeURIComponent(wallets)}&period=${period}${network ? `&network=${network}` : ""}`, { token: await getToken() })
        : api<PortfolioData>(`/data/portfolio/${w.id}?period=${period}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  });
  return demo ? demoData : { data: live.data, isLoading: live.isLoading, isError: live.isError };
}
