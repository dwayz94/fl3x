"use client";

import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Widget } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "./api";
import { useData, useIsDemo } from "./use-data";
import { WidgetHost } from "./use-portfolio";

/**
 * Data behind a widget built on the member's verified wallets (NFTs, trades,
 * Hyperliquid…). The editor asks for its own wallets (`/me/<path>?wallets=`);
 * public profiles ask by widget id (`/data/<path>/<id>`) so addresses never reach the page.
 */
export function useWalletWidget<T>(w: Widget, path: string, staleTime = 60_000) {
  const host = useContext(WidgetHost);
  const demo = useIsDemo();
  const { getToken } = useAuth();
  const wallets = typeof w.settings.wallets === "string" ? w.settings.wallets : "all";
  const demoData = useData<T>(path, { wallets }, demo);
  const live = useQuery({
    queryKey: [path, host, host === "editor" ? wallets : w.id],
    enabled: !demo,
    queryFn: async () =>
      host === "editor" ? api<T>(`/me/${path}?wallets=${encodeURIComponent(wallets)}`, { token: await getToken() }) : api<T>(`/data/${path}/${w.id}`),
    staleTime,
    refetchInterval: staleTime * 2,
    retry: false,
  });
  return demo ? demoData : { data: live.data, isLoading: live.isLoading, isError: live.isError };
}
