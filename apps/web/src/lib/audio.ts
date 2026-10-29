"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { api } from "./api";

/**
 * One shared player for music widget previews: starting a track stops the
 * previous one, and every widget knows which track is playing.
 */
let audio: HTMLAudioElement | null = null;
let current: string | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function player() {
  if (!audio) {
    audio = new Audio();
    audio.addEventListener("ended", () => {
      current = null;
      emit();
    });
  }
  return audio;
}

export function usePreview(title: string | null | undefined, artist: string | null | undefined) {
  const id = title && artist ? `${artist}|${title}` : null;
  const playingId = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => null,
  );
  const [state, setState] = useState<"idle" | "loading" | "unavailable">("idle");
  useEffect(() => setState("idle"), [id]);

  const toggle = async () => {
    if (!id) return;
    const a = player();
    if (playingId === id) {
      a.pause();
      current = null;
      return emit();
    }
    setState("loading");
    try {
      // Preview links expire quickly: always ask for a fresh one.
      const { url } = await api<{ url: string | null }>(`/data/preview?title=${encodeURIComponent(title!)}&artist=${encodeURIComponent(artist!)}`);
      if (!url) return setState("unavailable");
      a.src = url;
      a.volume = 0.8;
      await a.play();
      current = id;
      emit();
      setState("idle");
    } catch {
      setState("unavailable");
    }
  };

  return { playing: id !== null && playingId === id, loading: state === "loading", unavailable: state === "unavailable", toggle };
}
