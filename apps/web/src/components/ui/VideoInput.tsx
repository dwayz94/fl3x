"use client";

import { useState } from "react";
import { Delete02Icon, Video01Icon } from "@hugeicons/core-free-icons";
import { MAX_BACKGROUND_VIDEO_BYTES, MAX_BACKGROUND_VIDEO_SECONDS, isVideoUrl } from "@fl3x/shared";
import { cn } from "@/lib/cn";
import { ACCEPTED_VIDEOS, useVideoUpload, type VideoUpload } from "@/lib/upload";
import { Icon } from "./Icon";
import { FieldError } from "./Input";

/** Drop zone + live preview for a video / GIF background, with upload progress. */
export function VideoInput({
  value,
  poster,
  onChange,
  className,
}: {
  value: string | undefined;
  poster?: string;
  onChange: (media: VideoUpload | null) => void;
  className?: string;
}) {
  const { upload, progress, busy, error } = useVideoUpload();
  const [over, setOver] = useState(false);
  const take = async (file: File | undefined | null) => {
    if (!file || busy) return;
    const media = await upload(file);
    if (media) onChange(media);
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
          "group relative flex h-32 w-full cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed bg-[#111] transition-colors",
          over ? "border-brand bg-brand/10" : "border-white/10 hover:border-white/25",
        )}
      >
        <input type="file" accept={ACCEPTED_VIDEOS} className="sr-only" disabled={busy} onChange={(e) => void take(e.target.files?.[0])} />
        {value &&
          (isVideoUrl(value) ? (
            <video src={value} poster={poster || undefined} muted loop playsInline autoPlay className="absolute inset-0 size-full object-cover" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="absolute inset-0 size-full object-cover" />
          ))}
        <span
          className={cn(
            "relative flex w-36 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-fg-2 transition-opacity",
            value && !busy && "bg-black/60 opacity-0 backdrop-blur group-hover:opacity-100",
            busy && value && "bg-black/60 backdrop-blur",
          )}
        >
          {busy ? (
            <>
              <span className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <span className="block h-full rounded-full bg-brand transition-[width]" style={{ width: `${Math.round((progress ?? 0) * 100)}%` }} />
              </span>
              {/* Past 100% the API is still checking (and converting a GIF). */}
              {(progress ?? 0) < 1 ? `Uploading… ${Math.round((progress ?? 0) * 100)}%` : "Processing…"}
            </>
          ) : (
            <>
              <Icon icon={Video01Icon} size={22} />
              {value ? "Replace" : "Drop or click to upload"}
            </>
          )}
        </span>
      </label>
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] text-fg-3">
          MP4, WebM or GIF · {MAX_BACKGROUND_VIDEO_SECONDS} s and {MAX_BACKGROUND_VIDEO_BYTES / 1024 / 1024} MB max
        </span>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="flex items-center gap-1 text-[11px] text-fg-3 hover:text-danger">
            <Icon icon={Delete02Icon} size={12} />
            Remove
          </button>
        )}
      </div>
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}
