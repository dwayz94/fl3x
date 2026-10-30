"use client";

import { useState } from "react";
import { MAX_BACKGROUND_VIDEO_BYTES, MAX_BACKGROUND_VIDEO_SECONDS, type ApiError } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { site } from "@/config/site";
import { api, ApiRequestError } from "./api";

export type UploadKind = "avatar" | "background" | "widget";

export const ACCEPTED_IMAGES = "image/png,image/jpeg,image/webp";
const MAX_BYTES = 8 * 1024 * 1024;

/** Uploads an image to the API, which re-encodes and stores it. Returns its public URL. */
export function useUpload(kind: UploadKind) {
  const { getToken } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<string | null> => {
    setError(null);
    // Same rules as the API, checked early for a faster answer.
    if (!ACCEPTED_IMAGES.split(",").includes(file.type)) return setError("Only PNG, JPG and WebP images"), null;
    if (file.size > MAX_BYTES) return setError("Images must be 8 MB or less"), null;
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await api<{ url: string }>(`/me/media?kind=${kind}`, { method: "POST", body, token: await getToken() });
      return res.url;
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed");
      return null;
    } finally {
      setBusy(false);
    }
  };
  return { upload, busy, error };
}

/** Opens the file picker; resolves with the picked file (or nothing). */
export function pickImage(): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ACCEPTED_IMAGES;
    input.onchange = () => resolve(input.files?.[0] ?? null);
    input.click();
  });
}

/** Video backgrounds (Premium): what the API accepts. MOV is let through: the API takes it when it's H.264. */
export const ACCEPTED_VIDEOS = "video/mp4,video/webm,video/quicktime,image/gif";
const VIDEO_TYPES = ACCEPTED_VIDEOS.split(",");
const MAX_SECONDS = MAX_BACKGROUND_VIDEO_SECONDS + 0.25; // same slack as the API: encoders round

/** Duration and a still frame (JPEG) of a local video, or nulls when this browser can't decode it (the API decides then). */
function probeVideo(file: File): Promise<{ seconds: number | null; poster: Blob | null }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement("video");
    let seconds: number | null = null;
    const done = (poster: Blob | null) => {
      clearTimeout(timer);
      URL.revokeObjectURL(url);
      v.removeAttribute("src");
      resolve({ seconds, poster });
    };
    const timer = setTimeout(() => done(null), 8000);
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    v.onerror = () => done(null);
    v.onloadedmetadata = () => {
      seconds = Number.isFinite(v.duration) ? v.duration : null;
      if (seconds !== null && seconds > MAX_SECONDS) return done(null);
      // A frame a little in, past fade-ins and black first frames.
      v.currentTime = Math.min(0.5, (seconds ?? 1) / 2);
    };
    v.onseeked = () => {
      if (!v.videoWidth) return done(null);
      const scale = Math.min(1, 1600 / Math.max(v.videoWidth, v.videoHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(v.videoWidth * scale);
      canvas.height = Math.round(v.videoHeight * scale);
      canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((b) => done(b), "image/jpeg", 0.85);
    };
    v.src = url;
  });
}

/** POST with upload progress (fetch has none). */
function sendWithProgress<T>(path: string, body: FormData, token: string | null, onProgress: (p: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${site.apiUrl}${path}`);
    if (token) xhr.setRequestHeader("authorization", `Bearer ${token}`);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onerror = () => reject(new ApiRequestError(0, "network", "Upload failed, check your connection"));
    xhr.onload = () => {
      let json: (T & Partial<ApiError>) | null = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {}
      if (xhr.status >= 200 && xhr.status < 300 && json) resolve(json);
      else reject(new ApiRequestError(xhr.status, json?.error ?? "error", json?.message ?? "Upload failed"));
    };
    xhr.send(body);
  });
}

export interface VideoUpload {
  url: string;
  poster: string | null;
}

/**
 * Uploads a video / GIF background. Type, size and (for videos) duration are
 * checked here first to fail fast; the API checks them again on the file itself.
 */
export function useVideoUpload() {
  const { getToken } = useAuth();
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File): Promise<VideoUpload | null> => {
    setError(null);
    if (!VIDEO_TYPES.includes(file.type)) return setError("Only MP4, WebM and GIF files"), null;
    if (file.size > MAX_BACKGROUND_VIDEO_BYTES) return setError(`Videos must be ${MAX_BACKGROUND_VIDEO_BYTES / 1024 / 1024} MB or less`), null;
    setProgress(0);
    try {
      const body = new FormData();
      if (file.type !== "image/gif") {
        const { seconds, poster } = await probeVideo(file);
        if (seconds !== null && seconds > MAX_SECONDS) {
          return setError(`Videos must be ${MAX_BACKGROUND_VIDEO_SECONDS} seconds or less (this one is ${Math.round(seconds)} s)`), null;
        }
        body.append("file", file);
        if (poster) body.append("poster", poster, "poster.jpg");
      } else {
        body.append("file", file);
      }
      return await sendWithProgress<VideoUpload>("/me/media?kind=video", body, await getToken(), setProgress);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Upload failed");
      return null;
    } finally {
      setProgress(null);
    }
  };
  return { upload, progress, busy: progress !== null, error };
}
