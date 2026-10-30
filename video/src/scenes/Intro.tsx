import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { Brand, img, INK, MOGA, OUTFIT, PINK } from "../brand";
import { at, Backdrop, Flash, Pop, useShake, useSpring } from "../ui/kinetic";

/**
 * Beats 0–8: the bag drops, then hard-cut statements on the beat
 * ("YOUR BAGS. / YOUR WINS. / …") that land on "ONE LINK."
 */
export const INTRO_START = 0;
const t = at(INTRO_START);
const CARDS: [number, string][] = [
  [2, "YOUR B[A]GS."],
  [3, "YOUR W[I]NS."],
  [4, "YOUR T[A]STE."],
  [5, "YOUR CR[E]W."],
  [6, "ALL IN"],
  [7, "[ONE LINK.]"],
];

export function Intro() {
  const frame = useCurrentFrame();
  const bag = useSpring(t(0), { damping: 8 });
  const bagOut = interpolate(frame, [t(1.6), t(2)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const card = [...CARDS].reverse().find(([beat]) => frame >= t(beat));
  return (
    <AbsoluteFill>
      <Backdrop intensity={0.6} />
      {bagOut > 0 && (
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <Img src={img("fl3x-icon.svg")} style={{ width: 230, transform: `scale(${bag * bagOut}) rotate(${(1 - bag) * -25}deg)`, filter: `drop-shadow(0 0 60px ${PINK}66)` }} />
        </AbsoluteFill>
      )}
      {card && <Statement key={card[0]} from={t(card[0])} text={card[1]} />}
    </AbsoluteFill>
  );
}

/** One full-frame word card: lands big, then keeps pushing toward the camera. */
function Statement({ from, text }: { from: number; text: string }) {
  const frame = useCurrentFrame();
  const local = frame - from;
  const scale = interpolate(local, [0, 5, 13], [1.35, 1, 1.05], { extrapolateRight: "extend" });
  const shake = useShake([from], 10);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: shake }}>
      <p style={{ fontFamily: MOGA, fontSize: 250, color: INK, lineHeight: 1, transform: `scale(${scale})`, filter: `blur(${Math.max(0, 6 - local * 1.5)}px)` }}>
        <Brand>{text}</Brand>
      </p>
    </AbsoluteFill>
  );
}

/**
 * Beats 8–20: FL3X slams in on the drop, rises, and the pitch is told in three
 * lines with the UI dropped inline (avatar, a live widget, the link).
 */
export const MEET_START = 8;
const m = at(MEET_START);

export function Meet() {
  const frame = useCurrentFrame();
  const slam = useSpring(m(8), { damping: 9, stiffness: 220 });
  const rise = useSpring(m(11), { damping: 16 });
  const exit = interpolate(frame, [m(19.3), m(20)], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const shake = useShake([m(8)], 22);
  const url = "fl3x.lol/@nova";
  const typed = Math.max(0, Math.min(url.length, Math.floor((frame - m(16.5)) / 1.5)));

  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: exit, transform: `scale(${0.9 + 0.1 * exit})` }}>
        <Img
          src={img("fl3x-logo.svg")}
          style={{
            width: 900,
            position: "absolute",
            transform: `translateY(${-330 * rise}px) scale(${(1.9 - 0.9 * slam) * (1 - 0.6 * rise)})`,
            filter: `drop-shadow(0 0 ${80 * (1 - rise)}px ${PINK}88)`,
          }}
        />
        <div style={{ marginTop: 160, display: "grid", gap: 26, justifyItems: "center", fontFamily: MOGA, fontSize: 104, color: INK, lineHeight: 1 }}>
          <Line>
            <Pop from={m(12)}>YOUR</Pop>
            <Pop from={m(12.5)}>
              <span style={{ display: "inline-block", width: 104, height: 104, borderRadius: 52, overflow: "hidden", verticalAlign: "middle", boxShadow: `0 0 0 5px ${PINK}` }}>
                <Img src={img("fl3x-app-icon.svg")} style={{ width: "100%", height: "100%" }} />
              </span>
            </Pop>
            <Pop from={m(13)}>PROFILE,</Pop>
          </Line>
          <Line>
            <Pop from={m(14)}>LIVE</Pop>
            <Pop from={m(14.5)}>
              <span style={{ display: "inline-flex", alignItems: "center", height: 96, padding: "0 26px", borderRadius: 26, background: "rgba(255,255,255,0.1)", fontSize: 56, gap: 14 }}>
                <span style={{ padding: "8px 16px", borderRadius: 14, background: "#2FE3AC", color: "#0b0b0b" }}>+$12,276</span>
                <span style={{ fontFamily: OUTFIT, fontSize: 28, color: "rgba(255,255,255,0.6)" }}>this month</span>
              </span>
            </Pop>
            <Pop from={m(15)}>WIDGETS,</Pop>
          </Line>
          <Line>
            <Pop from={m(16)}>ONE</Pop>
            <Pop from={m(16.5)}>
              <span style={{ display: "inline-flex", alignItems: "center", height: 96, minWidth: 120, padding: "0 30px", borderRadius: 48, background: PINK, color: "#0b0b0b", fontFamily: OUTFIT, fontSize: 52 }}>
                {url.slice(0, typed)}
                <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>
              </span>
            </Pop>
            <Pop from={m(17.5)}>
              <span style={{ color: PINK }}>LINK.</span>
            </Pop>
          </Line>
        </div>
      </AbsoluteFill>
      <Flash from={m(8)} />
    </AbsoluteFill>
  );
}

const Line = ({ children }: { children: React.ReactNode }) => <div style={{ display: "flex", gap: 28, alignItems: "center" }}>{children}</div>;
