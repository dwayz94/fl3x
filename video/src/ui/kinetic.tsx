import type { CSSProperties, ReactNode } from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BG, PINK } from "../brand";
import { b } from "../timing";

/** Frames from a scene's own start: `at(start)(beat)` is `beat` on this Sequence's clock. */
export const at = (start: number) => (beat: number) => b(beat) - b(start);

/** Near-black ground with two slow pink/violet glows and a faint grid, like the site's hero. */
export function Backdrop({ accent = PINK, intensity = 1 }: { accent?: string; intensity?: number }) {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: BG, overflow: "hidden" }}>
      <div style={{ position: "absolute", width: 1100, height: 1100, left: -300 + Math.sin(f / 90) * 120, top: -500, borderRadius: 550, background: accent, filter: "blur(220px)", opacity: 0.16 * intensity }} />
      <div style={{ position: "absolute", width: 900, height: 900, right: -250, bottom: -450 + Math.cos(f / 80) * 100, borderRadius: 450, background: "#6d3cff", filter: "blur(220px)", opacity: 0.14 * intensity }} />
      <AbsoluteFill
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "96px 96px",
          backgroundPosition: `0 ${(f * 0.6) % 96}px`,
          maskImage: "radial-gradient(70% 70% at 50% 50%, black, transparent)",
        }}
      />
    </AbsoluteFill>
  );
}

/** Spring 0 → 1 starting at `from` (local frames). */
export function useSpring(from: number, config: { damping?: number; stiffness?: number; mass?: number } = {}) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - from, fps, config: { damping: 12, stiffness: 170, mass: 0.6, ...config } });
}

/** A word (or any inline thing) that lands with a pop and a little blur, at `from`. */
export function Pop({ from, children, style, y = 30 }: { from: number; children: ReactNode; style?: CSSProperties; y?: number }) {
  const frame = useCurrentFrame();
  const s = useSpring(from);
  if (frame < from) return <span style={{ display: "inline-block", opacity: 0, ...style }}>{children}</span>;
  return (
    <span
      style={{
        display: "inline-block",
        transform: `translateY(${(1 - s) * y}px) scale(${0.7 + 0.3 * s})`,
        opacity: Math.min(1, s * 1.6),
        filter: `blur(${Math.max(0, (1 - s) * 10)}px)`,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** White flash on a hit, gone in a few frames. */
export function Flash({ from, strength = 0.9, color = "#fff" }: { from: number; strength?: number; color?: string }) {
  const frame = useCurrentFrame();
  const o = interpolate(frame - from, [0, 1, 9], [0, strength, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return o > 0 ? <AbsoluteFill style={{ background: color, opacity: o, pointerEvents: "none" }} /> : null;
}

/** Camera shake on a hit: decays over ~10 frames. */
export function useShake(hits: number[], amount = 14) {
  const frame = useCurrentFrame();
  let x = 0;
  let y = 0;
  for (const h of hits) {
    const t = frame - h;
    if (t < 0 || t > 12) continue;
    const decay = (1 - t / 12) ** 2;
    x += Math.sin(t * 2.7) * amount * decay;
    y += Math.cos(t * 3.3) * amount * 0.7 * decay;
  }
  return `translate(${x}px, ${y}px)`;
}
