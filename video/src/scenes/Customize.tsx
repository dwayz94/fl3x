import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { CursorTrack, cursorPoseAt, type CursorWaypoint } from "@/components/snap-cn/cursor-track";
import { Brand, INK, MOGA, MUTED, OUTFIT, PINK } from "../brand";
import { at, Backdrop, Pop, useSpring } from "../ui/kinetic";
import { CARD_H, CARD_W, LAYOUT, ProfileCard, slotPx, WIDGETS, type Slot } from "../ui/ProfileCard";
import { CELL, GAP, sizePx } from "../ui/widgets";

/**
 * Beats 40–56: Customize. The cursor drags the music widget onto the P&L (they
 * swap), then the countdown to the top (the others make room), recolors the
 * card three times and turns on a video background.
 */
export const CUSTOM_START = 40;
const t = at(CUSTOM_START);

const W = 1920;
const H = 1080;
// The card sits a bit low and left, leaving room for the title and the color panel.
const ORIGIN = { x: (W - CARD_W) / 2 - 140, y: (H - CARD_H) / 2 + 60 };
const center = (id: string, slot: Slot) => {
  const p = slotPx(slot);
  const s = sizePx(WIDGETS.find((w) => w.id === id)!.size);
  return { x: (ORIGIN.x + p.x + s.w / 2) / W, y: (ORIGIN.y + p.y + s.h / 2) / H };
};
/** Pixel center (normalized) → the slot that puts a widget's center there. */
const toSlot = (id: string, n: { x: number; y: number }): Slot => {
  const s = sizePx(WIDGETS.find((w) => w.id === id)!.size);
  const zero = slotPx({ col: 0, row: 0 });
  return { col: (n.x * W - ORIGIN.x - zero.x - s.w / 2) / (CELL + GAP), row: (n.y * H - ORIGIN.y - zero.y - s.h / 2) / (CELL + GAP) };
};

const SWATCHES = [PINK, "#2FE3AC", "#9B7BFF", "#FF8132"];
const PANEL = { x: ORIGIN.x + CARD_W + 50, y: ORIGIN.y + 120 };
const swatch = (i: number) => ({ x: (PANEL.x + 34 + i * 70) / W, y: (PANEL.y + 96) / H });
const toggle = { x: (PANEL.x + 150) / W, y: (PANEL.y + 214) / H };

// Cursor path (local frames). Clicks land at `at + duration`.
const AFTER_SWAP: Record<string, Slot> = { ...LAYOUT, music: LAYOUT.pnl!, pnl: LAYOUT.music! };
const PATH: CursorWaypoint[] = [
  { at: t(40.3), x: 0.62, y: 1.05, duration: 8 },
  { at: t(40.5), ...center("music", LAYOUT.music!), duration: 14, click: true },
  { at: t(42), ...center("music", LAYOUT.pnl!), duration: 22 },
  { at: t(44.6), ...center("countdown", LAYOUT.countdown!), duration: 14, click: true },
  { at: t(46.1), ...center("countdown", { col: 4, row: 0 }), duration: 22 },
  { at: t(48.4), ...swatch(1), duration: 12, click: true },
  { at: t(49.6), ...swatch(2), duration: 9, click: true },
  { at: t(50.6), ...swatch(0), duration: 9, click: true },
  { at: t(51.4), ...toggle, duration: 12, click: true },
  { at: t(54), x: 1.1, y: 0.8, duration: 20 },
];
export function Customize() {
  const frame = useCurrentFrame();
  const enter = useSpring(t(40), { damping: 18 });
  const pose = cursorPoseAt(frame, PATH);

  // Drag 1: music follows the cursor from its grab to its drop, P&L slides into music's old spot.
  const grab1 = t(40.5) + 14;
  const drop1 = t(42) + 22;
  const grab2 = t(44.6) + 14;
  const drop2 = t(46.1) + 22;
  const lift1 = interpolate(frame, [grab1, grab1 + 5, drop1, drop1 + 6], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const lift2 = interpolate(frame, [grab2, grab2 + 5, drop2, drop2 + 6], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const pnlMove = useSpring(t(43), { damping: 14 });
  const makeRoom = useSpring(t(46.8), { damping: 14 });

  const slots: Record<string, Slot> = { ...LAYOUT };
  const lerp = (a: Slot, z: Slot, p: number): Slot => ({ col: a.col + (z.col - a.col) * p, row: a.row + (z.row - a.row) * p });
  slots.pnl = lerp(LAYOUT.pnl!, LAYOUT.music!, pnlMove);
  slots.music = frame < grab1 ? LAYOUT.music! : frame < drop1 ? toSlot("music", pose) : AFTER_SWAP.music!;
  for (const id of ["community", "portfolio", "followers"]) slots[id] = lerp(LAYOUT[id]!, { col: 4, row: LAYOUT[id]!.row + 1 }, makeRoom);
  slots.countdown = frame < grab2 ? LAYOUT.countdown! : frame < drop2 ? toSlot("countdown", pose) : { col: 4, row: 0 };

  // Colors and the video background.
  const colorClicks = [t(48.4) + 12, t(49.6) + 9, t(50.6) + 9];
  const picked = [1, 2, 0];
  let accent = PINK;
  colorClicks.forEach((c, i) => {
    if (frame >= c) accent = SWATCHES[picked[i]!]!;
  });
  const videoOn = t(51.4) + 12;
  const glow = useSpring(videoOn, { damping: 20 });
  const panel = useSpring(t(47.8), { damping: 14 });

  const widgets = WIDGETS.map((w) => ({ ...w, slot: slots[w.id]!, lift: w.id === "music" ? lift1 : w.id === "countdown" ? lift2 : 0 }));

  return (
    <AbsoluteFill>
      <Backdrop accent={accent} />
      <CursorTrack path={PATH} mode="light" size={46} ringColor={PINK} color="#fff" outlineColor="#0b0b0b">
        <AbsoluteFill>
          <div style={{ position: "absolute", left: ORIGIN.x, top: ORIGIN.y, transform: `translateY(${(1 - enter) * 60}px)`, opacity: enter }}>
            <ProfileCard widgets={widgets} accent={accent} glow={frame >= videoOn ? glow : 0} />
          </div>

          {/* Color + background panel, like Customize's library. */}
          <div
            style={{
              position: "absolute",
              left: PANEL.x,
              top: PANEL.y,
              width: 300,
              padding: 22,
              borderRadius: 28,
              background: "rgba(20,20,20,0.9)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              transform: `translateX(${(1 - panel) * 80}px)`,
              opacity: panel,
              fontFamily: OUTFIT,
              color: INK,
            }}
          >
            <p style={{ fontFamily: MOGA, fontSize: 26 }}>Color</p>
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Buttons and highlights</p>
            <div style={{ display: "flex", gap: 22 }}>
              {SWATCHES.map((c) => (
                <span key={c} style={{ width: 48, height: 48, borderRadius: 24, background: c, boxShadow: c === accent ? `0 0 0 4px #141414, 0 0 0 7px ${c}` : "none" }} />
              ))}
            </div>
            <p style={{ fontFamily: MOGA, fontSize: 26, marginTop: 26 }}>Background</p>
            <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 16, background: frame >= videoOn ? `${accent}26` : "rgba(255,255,255,0.06)" }}>
              <span style={{ fontSize: 15 }}>Video / GIF</span>
              <span style={{ marginLeft: "auto", fontSize: 11, padding: "3px 8px", borderRadius: 8, background: accent, color: "#0b0b0b" }}>Premium</span>
              <span style={{ width: 40, height: 24, borderRadius: 12, background: frame >= videoOn ? accent : "rgba(255,255,255,0.15)", position: "relative" }}>
                <span style={{ position: "absolute", top: 3, left: frame >= videoOn ? 19 : 3, width: 18, height: 18, borderRadius: 9, background: "#fff" }} />
              </span>
            </div>
          </div>
        </AbsoluteFill>
      </CursorTrack>

      {/* Title */}
      <div style={{ position: "absolute", top: 70, width: "100%", display: "flex", justifyContent: "center", gap: 34, fontFamily: MOGA, fontSize: 92, color: INK }}>
        <Pop from={t(40.5)}>DRAG IT.</Pop>
        <Pop from={t(48.4)}>
          <span style={{ color: accent }}>COLOR IT.</span>
        </Pop>
        <Pop from={t(52)}>
          <Brand>{"M[A]KE IT YOURS."}</Brand>
        </Pop>
      </div>
    </AbsoluteFill>
  );
}

/** SFX cue frames, local to the scene (the edit adds the scene's start). */
export const CUSTOM_CUES = {
  grabs: [t(40.5) + 14, t(44.6) + 14],
  drops: [t(42) + 22, t(46.1) + 22],
  colors: [t(48.4) + 12, t(49.6) + 9, t(50.6) + 9],
  video: t(51.4) + 12,
};
