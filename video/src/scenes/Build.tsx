import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Brand, INK, MOGA } from "../brand";
import { at, Backdrop, Pop, useSpring } from "../ui/kinetic";
import { LAYOUT, ProfileCard, WIDGETS } from "../ui/ProfileCard";

/**
 * Beats 20–40: the profile builds itself. Card rises, avatar and name land,
 * then widgets drop in faster and faster (the crescendo), and the card slides
 * aside for "LIVE. VERIFIED. ON-CHAIN."
 */
export const BUILD_START = 20;
const t = at(BUILD_START);
/** Widget entrances, accelerating. */
export const WIDGET_BEATS = [24, 25, 26, 26.75, 27.5, 28.25, 28.75, 29.25];

export function Build() {
  const frame = useCurrentFrame();
  const rise = useSpring(t(20), { damping: 15, stiffness: 120 });
  const aside = useSpring(t(31.5), { damping: 16 });
  const push = interpolate(frame, [t(36), t(40)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const widgets = WIDGETS.map((w, i) => ({ ...w, enter: t(WIDGET_BEATS[i]!), slot: LAYOUT[w.id]! }));

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", transform: `scale(${1 + push * 0.07})` }}>
        <div style={{ transform: `translate(${aside * 330}px, ${(1 - rise) * 900}px) scale(${1 - aside * 0.12})` }}>
          <ProfileCard widgets={widgets} avatarAt={t(21)} nameAt={t(21.5)} bioAt={t(22.5)} />
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ justifyContent: "center", paddingLeft: 120, transform: `scale(${1 + push * 0.07})` }}>
        <div style={{ display: "grid", gap: 6, fontFamily: MOGA, fontSize: 130, lineHeight: 1, color: INK }}>
          <Pop from={t(32)} y={60}>LIVE.</Pop>
          <Pop from={t(34)} y={60}>VERIFIED.</Pop>
          <Pop from={t(36)} y={60}>
            <Brand>[ON-CHAIN.]</Brand>
          </Pop>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
}
