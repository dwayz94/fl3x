"use client";

import { useQuery } from "@tanstack/react-query";
import type { EditableProfile } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "./api";

export interface EditorPayload {
  profile: EditableProfile;
  ownedBadges: string[];
  limits: { widgets: number; links: number };
}

export function useEditorProfile() {
  const { authenticated, getToken } = useAuth();
  return useQuery({
    queryKey: ["profile"],
    enabled: authenticated,
    queryFn: async () => api<EditorPayload>("/me/profile", { token: await getToken() }),
    staleTime: Infinity,
  });
}
