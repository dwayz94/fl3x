import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { img, MUTED, OUTFIT, PINK } from "../brand";
import { at, Backdrop, Flash, Pop, useShake, useSpring } from "../ui/kinetic";

/** Beats 84–96: the final hit. Logo, fl3x.lol, "Claim your name.", fade out. */
export const OUTRO_START = 84;
const t = at(OUTRO_START);

export function Outro() {
  const frame = useCurrentFrame();
  const slam = useSpring(t(84), { damping: 9, stiffness: 220 });
  const shake = useShake([t(84)], 26);
  const url = "fl3x.lol";
  const typed = Math.max(0, Math.min(url.length, Math.floor((frame - t(86)) / 2)));
  const fade = interpolate(frame, [t(93), t(96) + 20], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ transform: shake, opacity: fade }}>
      <Backdrop intensity={1.4} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", gap: 50 }}>
        <Img src={img("fl3x-logo.svg")} style={{ width: 980, transform: `scale(${2 - slam})`, filter: `drop-shadow(0 0 70px ${PINK}66)` }} />
        <div style={{ height: 110, display: "grid", placeItems: "center" }}>
          {frame >= t(86) && (
            <span style={{ display: "inline-flex", alignItems: "center", height: 104, padding: "0 46px", borderRadius: 52, background: PINK, color: "#0b0b0b", fontFamily: OUTFIT, fontSize: 60 }}>
              {url.slice(0, typed)}
              <span style={{ opacity: frame % 16 < 8 ? 1 : 0 }}>|</span>
            </span>
          )}
        </div>
        <p style={{ fontFamily: OUTFIT, fontSize: 38, color: MUTED }}>
          <Pop from={t(88)}>Claim your name.</Pop>
        </p>
      </AbsoluteFill>
      <Flash from={t(84)} />
    </AbsoluteFill>
  );
}
