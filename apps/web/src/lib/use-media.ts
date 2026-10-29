"use client";

import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Widget } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { api } from "./api";
import type { MediaData } from "./types";
import { useData, useIsDemo } from "./use-data";
import { WidgetHost } from "./use-portfolio";

const str = (v: unknown) => (typeof v === "string" ? v : "");

/** Video widget: a pinned video, else the channel's live stream or latest upload. */
export function useVideo(w: Widget) {
  const pinned = str(w.settings.url);
  const platform = str(w.settings.platform) || "youtube";
  const channel = str(w.settings.channel);
  const byUrl = useData<MediaData>("media", { url: pinned || undefined });
  const byChannel = useData<MediaData>("channel", { platform, handle: pinned ? undefined : channel || undefined });
  return { ...(pinned ? byUrl : byChannel), empty: !pinned && !channel };
}

/** Music widget: the member's Spotify (now playing / last played) or a picked link. */
export function useMusic(w: Widget) {
  const host = useContext(WidgetHost);
  const demo = useIsDemo();
  const { getToken } = useAuth();
  const link = str(w.settings.url);
  // Widgets saved before "source" existed only had a link.
  const live = (str(w.settings.source) || (link ? "link" : "spotify")) === "spotify";
  const byLink = useData<MediaData>("media", { url: live ? undefined : link || undefined });
  const demoNow = useData<MediaData>("spotify-now", { id: w.id }, demo && live);
  const now = useQuery({
    queryKey: ["spotify-now", host, w.id],
    enabled: live && !demo,
    queryFn: async () => (host === "editor" ? api<MediaData>("/me/spotify", { token: await getToken() }) : api<MediaData>(`/data/spotify/${w.id}`)),
    staleTime: 20_000,
    refetchInterval: 30_000,
    retry: false,
  });
  if (!live) return { ...byLink, live, empty: !link };
  if (demo) return { ...demoNow, live, empty: false };
  return { data: now.data, isLoading: now.isLoading, isError: now.isError, live, empty: false };
}
