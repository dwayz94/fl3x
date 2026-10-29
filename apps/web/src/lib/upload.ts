"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
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
