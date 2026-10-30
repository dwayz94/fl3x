import { AbsoluteFill, Img, interpolate, Easing, useCurrentFrame } from "remotion";
import { Brand, GREEN, img, INK, MOGA, MUTED, OUTFIT, PINK } from "../brand";
import { at, Backdrop, Flash, Pop, useShake, useSpring } from "../ui/kinetic";
import { LAYOUT, ProfileCard, WIDGETS } from "../ui/ProfileCard";

/**
 * Beats 64–84: the token. "HOLD $FL3X", then the balance counts up along the
 * Free → Starter → Premium track: Starter unlocks at 100K (b72), Premium at 1M
 * (b80). The card comes back with the checkmark stamped on and the perks.
 */
export const TOKEN_START = 64;
const t = at(TOKEN_START);
export const STARTER_BEAT = 72;
export const PREMIUM_BEAT = 80;
const STARTER = 100_000;
const PREMIUM = 1_000_000;
export const PERKS = ["Checkmark next to your name", "Custom fonts & cursors", "Animated, video & GIF backgrounds", "12 widgets · 8 links", "Hide the FL3X mark"];
export const PERK_BEATS = PERKS.map((_, i) => 81 + i * 0.5);

/** Balance at a frame: eased climb to 100K, then a faster climb to 1M. */
export function balanceAt(frame: number) {
  if (frame < t(67)) return 0;
  if (frame < t(STARTER_BEAT)) return interpolate(frame, [t(67), t(STARTER_BEAT)], [0, STARTER], { easing: Easing.in(Easing.quad) });
  return interpolate(frame, [t(STARTER_BEAT), t(PREMIUM_BEAT)], [STARTER, PREMIUM], { easing: Easing.in(Easing.cubic), extrapolateRight: "clamp" });
}

export function Token() {
  const frame = useCurrentFrame();
  const up = useSpring(t(66.5), { damping: 16 });
  const track = useSpring(t(66.8), { damping: 15 });
  const reveal = frame >= t(PREMIUM_BEAT);
  const shake = useShake([t(STARTER_BEAT), t(PREMIUM_BEAT)], 16);
  const balance = balanceAt(frame);
  // Two equal halves: Free → Starter, Starter → Premium.
  const fill = balance >= STARTER ? 0.5 + (0.5 * (balance - STARTER)) / (PREMIUM - STARTER) : (0.5 * balance) / STARTER;

  if (reveal) return <PremiumReveal />;
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Backdrop intensity={1 + fill} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 36, fontFamily: MOGA, fontSize: 190, color: INK, lineHeight: 1, transform: `translateY(${-300 * up}px) scale(${1 - up * 0.55})` }}>
          <Pop from={t(64)} y={60}>HOLD</Pop>
          <Pop from={t(65)} y={60}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 24, color: PINK }}>
              <Img src={img("fl3x-icon.svg")} style={{ width: 150 }} />
              $FL3X
            </span>
          </Pop>
        </div>

        {/* Balance + tier track (the Premium page's bar) */}
        <div style={{ position: "absolute", top: 330, width: 1300, opacity: track, transform: `translateY(${(1 - track) * 60}px)` }}>
          <p style={{ textAlign: "center", fontFamily: MOGA, fontSize: 110, color: INK, lineHeight: 1 }}>
            {Math.round(balance).toLocaleString("en-US")} <span style={{ color: MUTED }}>$FL3X</span>
          </p>
          <div style={{ position: "relative", height: 16, borderRadius: 8, background: "rgba(255,255,255,0.08)", marginTop: 56 }}>
            <div style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, borderRadius: 8, background: PINK, boxShadow: `0 0 30px ${PINK}` }} />
            {[0, 0.5, 1].map((p) => (
              <span
                key={p}
                style={{
                  position: "absolute",
                  left: `${p * 100}%`,
                  top: "50%",
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  transform: "translate(-50%, -50%)",
                  background: fill >= p ? PINK : "#0b0b0b",
                  border: `4px solid ${fill >= p ? PINK : "rgba(255,255,255,0.2)"}`,
                }}
              />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", marginTop: 28, fontFamily: OUTFIT }}>
            {[
              ["FREE", "No token needed", 0],
              ["STARTER", "100K $FL3X", STARTER],
              ["PREMIUM", "1M $FL3X", PREMIUM],
            ].map(([name, need, min], i) => (
              <div key={name as string} style={{ textAlign: i === 0 ? "left" : i === 1 ? "center" : "right" }}>
                <p style={{ fontFamily: MOGA, fontSize: 44, color: balance >= (min as number) && i > 0 ? PINK : INK }}>{name}</p>
                <p style={{ fontSize: 22, color: MUTED }}>{need}</p>
              </div>
            ))}
          </div>
          <Unlocked from={t(STARTER_BEAT)} label="STARTER UNLOCKED" sub="4 widgets · 4 links · 30-day analytics" />
        </div>
      </AbsoluteFill>
      <Flash from={t(STARTER_BEAT)} strength={0.35} color={PINK} />
    </AbsoluteFill>
  );
}

function Unlocked({ from, label, sub }: { from: number; label: string; sub: string }) {
  const frame = useCurrentFrame();
  const s = useSpring(from, { damping: 10 });
  if (frame < from) return null;
  return (
    <div style={{ marginTop: 36, display: "flex", justifyContent: "center", transform: `scale(${s})`, opacity: Math.min(1, s * 2) }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "16px 28px", borderRadius: 22, background: `${GREEN}22`, border: `2px solid ${GREEN}` }}>
        <span style={{ fontFamily: MOGA, fontSize: 40, color: GREEN }}>{label}</span>
        <span style={{ fontFamily: OUTFIT, fontSize: 22, color: MUTED }}>{sub}</span>
      </div>
    </div>
  );
}

/** b80–84: PREMIUM. The card returns with the checkmark stamped on, perks fly in. */
function PremiumReveal() {
  const frame = useCurrentFrame();
  const shake = useShake([t(PREMIUM_BEAT), t(80.5)], 18);
  const card = useSpring(t(PREMIUM_BEAT), { damping: 14 });
  const check = interpolate(frame, [t(80.5), t(80.5) + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const widgets = WIDGETS.map((w) => ({ ...w, slot: LAYOUT[w.id]! }));
  return (
    <AbsoluteFill style={{ transform: shake }}>
      <Backdrop intensity={2} />
      <div style={{ position: "absolute", left: 90, top: 210, transform: `scale(${0.82 * (0.85 + 0.15 * card)})`, transformOrigin: "top left", opacity: card }}>
        <ProfileCard widgets={widgets} check={check} glow={1} badges={[{ id: "premium", at: t(80.5) }, { id: "founder" }, { id: "og" }, { id: "whale" }]} />
      </div>
      <div style={{ position: "absolute", left: 1000, top: 170, display: "grid", gap: 18 }}>
        <p style={{ fontFamily: MOGA, fontSize: 150, color: INK, lineHeight: 1 }}>
          <Pop from={t(PREMIUM_BEAT)} y={50}>
            <Brand>{"PR[E]M[I]UM."}</Brand>
          </Pop>
        </p>
        {PERKS.map((p, i) => (
          <Pop key={p} from={t(PERK_BEATS[i]!)} y={20}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 16, fontFamily: OUTFIT, fontSize: 36, color: INK }}>
              <span style={{ width: 40, height: 40, borderRadius: 12, background: PINK, color: "#0b0b0b", display: "grid", placeItems: "center", fontSize: 26 }}>✓</span>
              {p}
            </span>
          </Pop>
        ))}
      </div>
      <Flash from={t(PREMIUM_BEAT)} strength={0.85} />
    </AbsoluteFill>
  );
}
