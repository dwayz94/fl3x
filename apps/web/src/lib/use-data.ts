"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

/** Cached widget data from the API's /data/* proxies. */
export function useData<T>(path: string, params: Record<string, string | undefined>, enabled = true) {
  const ok = enabled && Object.values(params).every(Boolean);
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery({
    queryKey: ["data", path, qs],
    enabled: ok,
    queryFn: () => api<T>(`/data/${path}?${qs}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  });
}
