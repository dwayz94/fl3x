"use client";

import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NftData, Widget } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "./api";
import { useData, useIsDemo } from "./use-data";
import { WidgetHost } from "./use-portfolio";

/** NFTs behind a gallery widget. Public profiles ask by widget id so addresses never reach the page. */
export function useNfts(w: Widget) {
  const host = useContext(WidgetHost);
  const demo = useIsDemo();
  const { getToken } = useAuth();
  const wallets = typeof w.settings.wallets === "string" ? w.settings.wallets : "all";
  const demoData = useData<NftData>("nfts", { wallets }, demo);
  const live = useQuery({
    queryKey: ["nfts", host, host === "editor" ? wallets : w.id],
    enabled: !demo,
    queryFn: async () =>
      host === "editor" ? api<NftData>(`/me/nfts?wallets=${encodeURIComponent(wallets)}`, { token: await getToken() }) : api<NftData>(`/data/nfts/${w.id}`),
    staleTime: 5 * 60_000,
    retry: false,
  });
  return demo ? demoData : { data: live.data, isLoading: live.isLoading, isError: live.isError };
}
