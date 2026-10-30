import { isAnimatedBackground, type ProfileTheme } from "@fl3x/shared";
import { cn } from "@/lib/cn";
import { VideoBackdrop } from "./VideoBackdrop";

/**
 * Premium animated backgrounds, pure CSS: only transform and opacity move
 * (GPU friendly). Keyframes live in globals.css; prefers-reduced-motion
 * freezes them on a still frame. Also plays uploaded video / GIF
 * backgrounds. Renders nothing for other backgrounds.
 */
export function AnimatedBackdrop({ theme, className, compact }: { theme: ProfileTheme; className?: string; compact?: boolean }) {
  const kind = theme.background;
  if (kind === "video") return theme.backgroundUrl ? <VideoBackdrop url={theme.backgroundUrl} poster={theme.backgroundPoster} className={className} /> : null;
  if (!isAnimatedBackground(kind)) return null;
  const accent = theme.accent;
  const scene = (
    <>
      {kind === "aurora" && <Aurora accent={accent} />}
      {kind === "money" && <MoneyRain />}
      {kind === "grid" && <Grid accent={accent} />}
      {kind === "pulse" && <Pulse accent={accent} />}
    </>
  );
  return (
    <div aria-hidden className={cn("pointer-events-none overflow-hidden", className)}>
      {/* Small previews draw the full-size scene scaled down, so blur and spacing keep their proportions. */}
      {compact ? <div className="absolute top-0 left-0 h-[300%] w-[300%] origin-top-left scale-[0.3333]">{scene}</div> : scene}
    </div>
  );
}

/** Slow drifting blurred blobs. */
function Aurora({ accent }: { accent: string }) {
  const blob = "absolute rounded-full blur-[90px] will-change-transform";
  return (
    <>
      <span className={cn(blob, "top-[-20%] left-[-10%] size-[60%] opacity-55 [animation:fl3x-drift-a_22s_ease-in-out_infinite_alternate]")} style={{ background: accent }} />
      <span className={cn(blob, "right-[-15%] bottom-[-25%] size-[65%] bg-[#6d3cff] opacity-45 [animation:fl3x-drift-b_28s_ease-in-out_infinite_alternate]")} />
      <span className={cn(blob, "top-[30%] left-[35%] size-[40%] bg-[#ff4fa3] opacity-30 [animation:fl3x-drift-c_18s_ease-in-out_infinite_alternate]")} />
    </>
  );
}

/** Sparse pixel money bags falling slowly. Positions are fixed (no random) so server and client match. */
const BAGS = [
  [4, 22, 0, 0.42], [13, 30, -9, 0.3], [22, 18, -4, 0.45], [31, 26, -15, 0.32], [42, 34, -2, 0.26],
  [51, 20, -11, 0.42], [60, 28, -6, 0.3], [69, 24, -17, 0.45], [78, 32, -3, 0.28], [88, 22, -13, 0.38], [95, 28, -7, 0.26],
] as const;

function MoneyRain() {
  return (
    <>
      <span className="absolute inset-x-0 top-0 h-2/3 bg-[radial-gradient(80%_70%_at_50%_0%,rgba(255,151,203,0.14),transparent)]" />
      {BAGS.map(([left, dur, delay, opacity], i) => (
        <span
          key={i}
          // Full-height column: translateY in % then follows the container (page or small tile).
          className="absolute inset-y-0 block will-change-transform [animation:fl3x-fall_linear_infinite]"
          style={{ left: `${left}%`, animationDuration: `${dur}s`, animationDelay: `${delay}s`, opacity }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/fl3x-icon.svg" alt="" className="[image-rendering:pixelated]" style={{ width: 20 + (i % 3) * 10, rotate: `${(i % 5) * 6 - 12}deg` }} />
        </span>
      ))}
    </>
  );
}

/** Retro perspective grid rolling toward the viewer, fading into a glowing horizon. */
function Grid({ accent }: { accent: string }) {
  const line = `color-mix(in srgb, ${accent} 60%, transparent)`;
  return (
    <>
      <span className="absolute inset-x-0 top-[45%] h-40 -translate-y-1/2 blur-3xl" style={{ background: `color-mix(in srgb, ${accent} 45%, transparent)` }} />
      {/* Floor plane: hinged on the horizon, tilted toward the viewer. The perspective must stay deeper than
          the tilted plane, or its near edge ends up "behind the camera" and renders upside down. */}
      <div className="absolute inset-x-[-50%] top-[45%] bottom-0 [perspective:1000px] [perspective-origin:50%_0%]">
        <div className="absolute inset-0 origin-top [transform:rotateX(58deg)] [mask-image:linear-gradient(to_bottom,transparent,black_25%)]">
          <div
            className="absolute inset-x-0 top-[-80px] bottom-0 will-change-transform [animation:fl3x-grid_2.4s_linear_infinite]"
            style={{
              backgroundImage: `linear-gradient(${line} 2px, transparent 2px), linear-gradient(90deg, ${line} 2px, transparent 2px)`,
              backgroundSize: "80px 80px",
            }}
          />
        </div>
      </div>
    </>
  );
}

/** A soft glow breathing in the accent color. */
function Pulse({ accent }: { accent: string }) {
  return (
    <>
      <span
        className="absolute top-1/2 left-1/2 size-[160%] -translate-1/2 rounded-full will-change-transform [animation:fl3x-breathe_7s_ease-in-out_infinite]"
        style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${accent} 42%, transparent) 0%, transparent 100%)` }}
      />
      <span
        className="absolute top-1/2 left-1/2 size-[90%] -translate-1/2 rounded-full will-change-transform [animation:fl3x-breathe_7s_ease-in-out_infinite_-3.5s]"
        style={{ background: `radial-gradient(closest-side, color-mix(in srgb, ${accent} 26%, transparent) 0%, transparent 100%)` }}
      />
    </>
  );
}
