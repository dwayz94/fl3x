"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { isVideoUrl } from "@fl3x/shared";
import { cn } from "@/lib/cn";

const REDUCE = "(prefers-reduced-motion: reduce)";
function subscribe(cb: () => void) {
  const mq = window.matchMedia(REDUCE);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useReducedMotion = () => useSyncExternalStore(subscribe, () => window.matchMedia(REDUCE).matches, () => false);

/**
 * Premium video / GIF background: a muted loop covering its box, behind the
 * card. With reduced motion it stays on a still frame (the poster, or the
 * video's first frame). GIFs are stored as animated WebP and shown as images.
 */
export function VideoBackdrop({ url, poster, className }: { url: string; poster?: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const video = isVideoUrl(url);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // Set as a property too: React doesn't always write the attribute, and iOS only autoplays muted videos.
    v.muted = true;
    if (reduce) v.pause();
    // Refused in Low Power Mode or data saver: the poster stays.
    else void v.play().catch(() => {});
  }, [reduce, url]);

  return (
    <div aria-hidden className={cn("pointer-events-none overflow-hidden", className)}>
      {video ? (
        <video
          ref={ref}
          key={url}
          // #t: Safari paints the first frame of a paused video only when asked for a start time.
          src={reduce && !poster ? `${url}#t=0.001` : url}
          poster={poster || undefined}
          muted
          loop
          playsInline
          autoPlay={!reduce}
          preload={reduce ? "metadata" : "auto"}
          disablePictureInPicture
          disableRemotePlayback
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={reduce && poster ? poster : url} alt="" decoding="async" className="absolute inset-0 size-full object-cover" />
      )}
    </div>
  );
}
