import type { CSSProperties } from "react";
import { Img, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { img, INK, MOGA, MUTED, OUTFIT, PINK } from "../brand";
import { CELL, GAP, sizePx, WidgetView, type Size, type WidgetKind } from "./widgets";

export type Slot = { col: number; row: number };
export type CardWidget = { id: string; kind: WidgetKind; size: Size; enter?: number };

export const GRID_W = CELL * 8 + GAP * 7;
export const GRID_H = CELL * 4 + GAP * 3;
const PAD = 36;
const HEADER = 150;
export const CARD_W = GRID_W + PAD * 2;
export const CARD_H = PAD + HEADER + 24 + GRID_H + PAD;
/** Top-left of a grid slot inside the card, in px. */
export const slotPx = (s: Slot) => ({ x: PAD + s.col * (CELL + GAP), y: PAD + HEADER + 24 + s.row * (CELL + GAP) });

/** The 8 widgets of Nova's profile and where they sit. */
export const WIDGETS: CardWidget[] = [
  { id: "pnl", kind: "pnl", size: "large" },
  { id: "music", kind: "music", size: "large" },
  { id: "community", kind: "community", size: "long" },
  { id: "portfolio", kind: "portfolio", size: "long" },
  { id: "nfts", kind: "nfts", size: "large" },
  { id: "clock", kind: "clock", size: "large" },
  { id: "followers", kind: "followers", size: "long" },
  { id: "countdown", kind: "countdown", size: "long" },
];
export const LAYOUT: Record<string, Slot> = {
  pnl: { col: 0, row: 0 },
  music: { col: 2, row: 0 },
  community: { col: 4, row: 0 },
  portfolio: { col: 4, row: 1 },
  nfts: { col: 0, row: 2 },
  clock: { col: 2, row: 2 },
  followers: { col: 4, row: 2 },
  countdown: { col: 4, row: 3 },
};

/** Pop-in: scale and lift on a bouncy spring from `at`. 0 before, 1 once settled. */
export function usePop(at: number | undefined, damping = 11) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (at === undefined) return 1;
  return spring({ frame: frame - at, fps, config: { damping, stiffness: 180, mass: 0.7 } });
}

export interface ProfileCardProps {
  widgets: (CardWidget & { slot: Slot; lift?: number })[];
  accent?: string;
  name?: string;
  /** Frame the avatar pops in (undefined = already there). */
  avatarAt?: number;
  /** Frame the name starts typing. */
  nameAt?: number;
  bioAt?: number;
  /** 0 → 1: the Premium checkmark stamping in next to the name. */
  check?: number;
  badges?: { id: string; at?: number }[];
  /** Video / GIF style background behind the widgets (0 → 1). */
  glow?: number;
  style?: CSSProperties;
}

/** Nova's FL3X card, as on the site: avatar, name, badges, then the widget grid. */
export function ProfileCard({ widgets, accent = PINK, name = "NOVA", avatarAt, nameAt, bioAt, check = 0, badges = [], glow = 0, style }: ProfileCardProps) {
  const frame = useCurrentFrame();
  const avatar = usePop(avatarAt, 9);
  const bio = usePop(bioAt, 20);
  const letters = nameAt === undefined ? name.length : Math.max(0, Math.min(name.length, Math.floor((frame - nameAt) / 2)));
  const checkScale = check > 0 ? interpolate(check, [0, 0.6, 1], [2.4, 0.85, 1]) : 0;

  return (
    <div
      style={{
        position: "relative",
        width: CARD_W,
        height: CARD_H,
        borderRadius: 44,
        background: "rgba(24,24,24,0.82)",
        boxShadow: "0 40px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
        overflow: "hidden",
        fontFamily: OUTFIT,
        ...style,
      }}
    >
      {glow > 0 && (
        <div style={{ position: "absolute", inset: 0, opacity: glow }}>
          <div style={{ position: "absolute", width: 600, height: 600, left: -150 + Math.sin(frame / 40) * 80, top: -200, borderRadius: 300, background: accent, filter: "blur(120px)", opacity: 0.45 }} />
          <div style={{ position: "absolute", width: 520, height: 520, right: -120, bottom: -180 + Math.cos(frame / 35) * 60, borderRadius: 260, background: "#6d3cff", filter: "blur(120px)", opacity: 0.4 }} />
        </div>
      )}

      {/* Header */}
      <div style={{ position: "absolute", left: PAD, top: PAD, display: "flex", gap: 26, alignItems: "center", height: HEADER }}>
        <div style={{ width: 128, height: 128, borderRadius: 64, overflow: "hidden", transform: `scale(${avatar})`, background: "#111", boxShadow: `0 0 0 4px rgba(255,255,255,0.06)` }}>
          <Img src={img("fl3x-app-icon.svg")} style={{ width: "100%", height: "100%" }} />
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, height: 56 }}>
            <span style={{ fontFamily: MOGA, fontSize: 60, lineHeight: 1, color: INK }}>{name.slice(0, letters)}</span>
            {checkScale > 0 && <Img src={img("verified.svg")} style={{ width: 40, height: 40, transform: `scale(${checkScale})` }} />}
          </div>
          <p style={{ color: MUTED, fontSize: 18, textTransform: "uppercase", letterSpacing: 1, opacity: bio, transform: `translateY(${(1 - bio) * 10}px)` }}>Flex on all screens</p>
          <div style={{ display: "flex", gap: 8, height: 34 }}>
            {badges.map((bdg) => (
              <Badge key={bdg.id} id={bdg.id} at={bdg.at} />
            ))}
          </div>
        </div>
      </div>

      {/* Widgets */}
      {widgets.map((w) => {
        const p = slotPx(w.slot);
        const { w: width, h: height } = sizePx(w.size);
        return <PlacedWidget key={w.id} w={w} x={p.x} y={p.y} width={width} height={height} accent={accent} />;
      })}
    </div>
  );
}

function PlacedWidget({ w, x, y, width, height, accent }: { w: CardWidget & { lift?: number }; x: number; y: number; width: number; height: number; accent: string }) {
  const pop = usePop(w.enter);
  const lift = w.lift ?? 0;
  if (pop <= 0.001) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height,
        transform: `translateY(${(1 - pop) * 40}px) scale(${(0.6 + 0.4 * pop) * (1 + lift * 0.06)}) rotate(${lift * -2}deg)`,
        opacity: Math.min(1, pop * 1.5),
        zIndex: lift > 0 ? 10 : 1,
        filter: lift > 0 ? `drop-shadow(0 ${24 * lift}px ${40 * lift}px rgba(0,0,0,0.6))` : undefined,
      }}
    >
      <WidgetView kind={w.kind} accent={accent} />
    </div>
  );
}

function Badge({ id, at }: { id: string; at?: number }) {
  const s = usePop(at, 8);
  return (
    <div style={{ width: 34, height: 34, borderRadius: 10, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", transform: `scale(${s})` }}>
      <Img src={img(`badges/${id}.svg`)} style={{ width: 20, height: 20 }} />
    </div>
  );
}
