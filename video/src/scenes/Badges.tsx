import { AbsoluteFill, Img, interpolate, useCurrentFrame } from "remotion";
import { Brand, img, INK, MOGA, MUTED, OUTFIT } from "../brand";
import { at, Backdrop, Pop, useSpring } from "../ui/kinetic";

/**
 * Beats 56–64: badges. A ring of the real badge icons pops in on eighth notes
 * around "EARN BADGES.", turns, then collapses into the center.
 */
export const BADGES_START = 56;
const t = at(BADGES_START);

export const RING = [
  ["founder", "Founder"],
  ["og", "OG"],
  ["early-adopter", "Early Adopter"],
  ["whale", "Whale"],
  ["contributor", "Contributor"],
  ["recruiter", "Recruiter"],
  ["kol", "KOL"],
  ["creator", "Creator"],
  ["legend", "Legend"],
  ["bug-hunter", "Bug Hunter"],
] as const;
/** Each badge lands on an eighth note. */
export const BADGE_BEATS = RING.map((_, i) => 56.5 + i * 0.5);

export function Badges() {
  const frame = useCurrentFrame();
  const spin = interpolate(frame, [0, t(64)], [0, 40]);
  const collapse = interpolate(frame, [t(62.5), t(63.6)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const ease = collapse * collapse;

  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: 1 - ease }}>
        <p style={{ fontFamily: MOGA, fontSize: 150, color: INK, lineHeight: 1, transform: `scale(${1 - ease * 0.5})` }}>
          <Pop from={t(56)} y={50}>
            <Brand>{"EARN B[A]DGES."}</Brand>
          </Pop>
        </p>
        <p style={{ fontFamily: OUTFIT, fontSize: 30, color: MUTED, marginTop: 18 }}>
          <Pop from={t(57)}>For holding, inviting, building, showing up early.</Pop>
        </p>
      </AbsoluteFill>
      {RING.map(([id, name], i) => (
        <BadgeTile key={id} id={id} name={name} from={t(BADGE_BEATS[i]!)} angle={(i / RING.length) * 360 + spin} collapse={ease} />
      ))}
    </AbsoluteFill>
  );
}

function BadgeTile({ id, name, from, angle, collapse }: { id: string; name: string; from: number; angle: number; collapse: number }) {
  const s = useSpring(from, { damping: 9 });
  const r = (1 - collapse) * 400;
  const a = (angle * Math.PI) / 180;
  const x = Math.cos(a) * r * 1.6;
  const y = Math.sin(a) * r;
  return (
    <div
      style={{
        position: "absolute",
        left: 960 + x - 60,
        top: 540 + y - 60,
        width: 120,
        display: "grid",
        justifyItems: "center",
        gap: 10,
        transform: `scale(${s * (1 - collapse * 0.6)})`,
        opacity: Math.min(1, s * 2) * (1 - collapse),
      }}
    >
      <div style={{ width: 96, height: 96, borderRadius: 28, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)" }}>
        <Img src={img(`badges/${id}.svg`)} style={{ width: 52, height: 52 }} />
      </div>
      <span style={{ fontFamily: MOGA, fontSize: 20, color: INK, whiteSpace: "nowrap" }}>{name}</span>
    </div>
  );
}
