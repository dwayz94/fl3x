"use client";

import { createContext, createElement, useContext, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

type Resolver = (path: string, params: Record<string, string | undefined>) => unknown;

/**
 * Fixed widget data for showcase pages (/widgets, /example): when a resolver
 * answers, widgets render it instead of calling the API.
 */
const DemoData = createContext<Resolver | null>(null);

export function DemoDataProvider({ resolve, children }: { resolve: Resolver; children: ReactNode }) {
  return createElement(DemoData.Provider, { value: resolve }, children);
}

export function useIsDemo() {
  return useContext(DemoData) !== null;
}

/** Cached widget data from the API's /data/* proxies. */
export function useData<T>(path: string, params: Record<string, string | undefined>, enabled = true) {
  const demo = useContext(DemoData)?.(path, params) as T | undefined;
  const ok = enabled && demo === undefined && Object.values(params).every(Boolean);
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  const query = useQuery({
    queryKey: ["data", path, qs],
    enabled: ok,
    queryFn: () => api<T>(`/data/${path}?${qs}`),
    staleTime: 60_000,
    refetchInterval: 120_000,
    retry: false,
  });
  if (demo !== undefined) return { data: demo, isLoading: false, isError: false };
  return { data: query.data, isLoading: query.isLoading, isError: query.isError };
}
