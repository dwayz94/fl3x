"use client";

import { useQuery } from "@tanstack/react-query";
import type { PublicConfig } from "@fl3x/shared";
import { api } from "./api";

export const useConfig = () => useQuery({ queryKey: ["config"], queryFn: () => api<PublicConfig>("/config"), staleTime: 5 * 60_000 });
