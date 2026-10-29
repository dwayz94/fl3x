"use client";

import { useState } from "react";
import { Delete02Icon, ImageUploadIcon } from "@hugeicons/core-free-icons";
import { cn } from "@/lib/cn";
import { ACCEPTED_IMAGES, useUpload, type UploadKind } from "@/lib/upload";
import { Icon } from "./Icon";
import { FieldError } from "./Input";

/** Drop zone + preview for one image. Click or drop a PNG / JPG / WebP. */
export function ImageInput({
  kind,
  value,
  onChange,
  className,
  round,
}: {
  kind: UploadKind;
  value: string | undefined;
  onChange: (url: string) => void;
  className?: string;
  round?: boolean;
}) {
  const { upload, busy, error } = useUpload(kind);
  const [over, setOver] = useState(false);
  const take = async (file: File | undefined | null) => {
    if (!file) return;
    const url = await upload(file);
    if (url) onChange(url);
  };

  return (
    <div className={className}>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          void take(e.dataTransfer.files[0]);
        }}
        className={cn(
          "group relative flex cursor-pointer items-center justify-center overflow-hidden border-2 border-dashed bg-[#111] transition-colors",
          round ? "mx-auto size-28 rounded-full" : "h-32 w-full rounded-2xl",
          over ? "border-brand bg-brand/10" : "border-white/10 hover:border-white/25",
        )}
      >
        <input type="file" accept={ACCEPTED_IMAGES} className="sr-only" onChange={(e) => void take(e.target.files?.[0])} />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value && <img src={value} alt="" className="absolute inset-0 size-full object-cover" />}
        <span
          className={cn(
            "relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-fg-2 transition-opacity",
            value && "bg-black/60 opacity-0 backdrop-blur group-hover:opacity-100",
          )}
        >
          {busy ? (
            <span className="size-5 animate-spin rounded-full border-2 border-brand border-t-transparent" />
          ) : (
            <Icon icon={ImageUploadIcon} size={22} />
          )}
          {busy ? "Uploading…" : value ? "Replace" : "Drop or click to upload"}
        </span>
      </label>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-fg-3">PNG, JPG or WebP · 8 MB max</span>
        {value && !round && (
          <button type="button" onClick={() => onChange("")} className="flex items-center gap-1 text-[11px] text-fg-3 hover:text-danger">
            <Icon icon={Delete02Icon} size={12} />
            Remove
          </button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
