import type { CSSProperties, ReactNode } from "react";
import { Img, interpolate, useCurrentFrame } from "remotion";
import { GREEN, img, INK, MOGA, MUTED, OUTFIT, PINK } from "../brand";

/** Same grid as the site's card: 8 columns, large = 2×2 cells, long = 4×1. */
export const CELL = 92;
export const GAP = 14;
export type Size = "large" | "long";
export const sizePx = (size: Size) => (size === "large" ? { w: CELL * 2 + GAP, h: CELL * 2 + GAP } : { w: CELL * 4 + GAP * 3, h: CELL });

const frameStyle = (size: Size): CSSProperties => ({
  width: "100%",
  height: "100%",
  borderRadius: 28,
  background: "rgba(255,255,255,0.09)",
  padding: size === "large" ? 16 : "0 16px",
  display: "flex",
  flexDirection: size === "large" ? "column" : "row",
  alignItems: size === "large" ? "stretch" : "center",
  gap: 12,
  color: INK,
  fontFamily: OUTFIT,
  overflow: "hidden",
  position: "relative",
});
const title: CSSProperties = { fontFamily: MOGA, fontSize: 22, lineHeight: 1, textTransform: "uppercase" };
const small: CSSProperties = { fontSize: 11, color: MUTED };
const pill = (accent: string): CSSProperties => ({
  background: accent,
  color: "#0b0b0b",
  borderRadius: 10,
  padding: "4px 12px",
  fontSize: 12,
  fontFamily: OUTFIT,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
});

/** Live-looking numbers: they drift a little every frame like real data. */
const useDrift = (base: number, amount: number, speed = 0.05) => base + Math.sin(useCurrentFrame() * speed) * amount;

export function PnlWidget({ accent }: { accent: string }) {
  const v = useDrift(12276.34, 180);
  return (
    <div style={frameStyle("large")}>
      <p style={{ ...small, textAlign: "center" }}>This month</p>
      <div style={{ ...pill(GREEN), alignSelf: "center", fontFamily: MOGA, fontSize: 24, padding: "6px 14px", borderRadius: 12 }}>
        +${v.toLocaleString("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 })}
      </div>
      <div style={{ marginTop: "auto", display: "grid", gap: 6, fontSize: 12 }}>
        {[
          ["PNL", "+18.4%", GREEN],
          ["START", "$66.8K", INK],
          ["END", "$79.1K", INK],
        ].map(([k, val, c]) => (
          <div key={k} style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: MUTED, fontFamily: MOGA }}>{k}</span>
            <span style={{ color: c, fontFamily: MOGA }}>{val}</span>
          </div>
        ))}
      </div>
      <span style={{ position: "absolute", top: 14, right: 16, width: 8, height: 8, borderRadius: 4, background: accent }} />
    </div>
  );
}

export function MusicWidget({ accent }: { accent: string }) {
  const f = useCurrentFrame();
  return (
    <div style={{ ...frameStyle("large"), background: "linear-gradient(160deg, rgba(123,92,255,0.55), rgba(255,151,203,0.25))" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div style={{ width: 78, height: 78, borderRadius: 14, background: "conic-gradient(from 200deg, #ff97cb, #7b5cff, #2fe3ac, #ff97cb)", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }} />
        <SpotifyMark />
      </div>
      <div style={{ marginTop: "auto" }}>
        <p style={title}>Night Drive</p>
        <p style={small}>Nova</p>
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 3, height: 16, alignItems: "flex-end" }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <span key={i} style={{ width: 3, borderRadius: 2, background: "#1DB954", height: 4 + Math.abs(Math.sin(f * 0.28 + i * 1.3)) * 12 }} />
          ))}
        </div>
        <div style={{ width: 34, height: 34, borderRadius: 17, background: INK, display: "grid", placeItems: "center" }}>
          <div style={{ width: 0, height: 0, borderLeft: `11px solid ${accent === PINK ? "#0b0b0b" : "#0b0b0b"}`, borderTop: "7px solid transparent", borderBottom: "7px solid transparent", marginLeft: 3 }} />
        </div>
      </div>
    </div>
  );
}

export function CommunityWidget({ accent }: { accent: string }) {
  return (
    <div style={frameStyle("long")}>
      <Img src={img("fl3x-app-icon.svg")} style={{ width: 58, height: 58, borderRadius: 29 }} />
      <div style={{ flex: 1, minWidth: 0, display: "grid", gap: 4 }}>
        <p style={title}>FL3X Discord</p>
        <p style={{ ...small, fontSize: 10 }}>
          <span style={{ color: GREEN }}>●</span> {Math.round(useDrift(3454, 12)).toLocaleString()} online · 11,972 members
        </p>
        <span style={{ ...pill(accent), alignSelf: "start", fontSize: 11, padding: "2px 10px" }}>Join</span>
      </div>
      <DiscordMark />
    </div>
  );
}

export function PortfolioWidget() {
  const f = useCurrentFrame();
  const draw = interpolate(f % 400, [0, 60], [0, 1], { extrapolateRight: "clamp" });
  const pts = Array.from({ length: 24 }, (_, i) => [i * 8, 40 - (i * 1.2 + Math.sin(i * 0.9) * 6)]);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
  return (
    <div style={frameStyle("long")}>
      <div style={{ display: "grid", gap: 2 }}>
        <p style={{ ...small, fontFamily: MOGA }}>PORTFOLIO · 7D</p>
        <p style={{ fontFamily: MOGA, fontSize: 28, lineHeight: 1 }}>
          ${useDrift(134548.73, 220).toLocaleString("en-US", { maximumFractionDigits: 0 })}
          <span style={{ color: MUTED }}>.73</span>
        </p>
        <p style={{ color: GREEN, fontFamily: MOGA, fontSize: 12 }}>+$12,276 +9.1%</p>
      </div>
      <svg viewBox="0 0 190 50" style={{ flex: 1, height: 60 }}>
        <path d={d} fill="none" stroke={GREEN} strokeWidth={2.5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
      </svg>
    </div>
  );
}

export function NftWidget() {
  return (
    <div style={frameStyle("large")}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <p style={{ ...title, fontSize: 18 }}>NFTs</p>
        <p style={{ fontFamily: MOGA, fontSize: 13 }}>
          24 <span style={{ color: MUTED }}>NFTS</span>
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flex: 1 }}>
        {["y00t-4718", "degod-3744", "doge-capital-908", "meego-1339"].map((n) => (
          <Img key={n} src={img(`nfts/${n}.webp`)} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
        ))}
      </div>
    </div>
  );
}

export function ClockWidget() {
  const f = useCurrentFrame();
  const minutes = 41 + Math.floor(f / 300);
  return (
    <div style={{ ...frameStyle("large"), background: "linear-gradient(180deg, #8a6bd8 0%, #3b2d63 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", ...small, color: "rgba(255,255,255,0.8)" }}>
        <span>GMT+4</span>
        <span>☼</span>
      </div>
      <p style={{ fontFamily: MOGA, fontSize: 64, lineHeight: 1, marginTop: "auto", textAlign: "center" }}>
        05<span style={{ opacity: f % 30 < 15 ? 1 : 0.35 }}>:</span>
        {String(minutes).padStart(2, "0")}
      </p>
      <p style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center", fontFamily: MOGA, fontSize: 14 }}>
        <span style={{ display: "inline-grid", width: 20, height: 13, borderRadius: 2, overflow: "hidden", gridTemplateRows: "1fr 1fr 1fr", position: "relative" }}>
          <span style={{ background: "#00732F" }} />
          <span style={{ background: "#fff" }} />
          <span style={{ background: "#000" }} />
          <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 6, background: "#FF0000" }} />
        </span>
        DUBAI
      </p>
    </div>
  );
}

export function FollowersWidget({ accent, count = 48210 }: { accent: string; count?: number }) {
  return (
    <div style={frameStyle("long")}>
      <div style={{ width: 58, height: 58, borderRadius: 18, background: "#111", display: "grid", placeItems: "center" }}>
        <XMark />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontFamily: MOGA, fontSize: 30, lineHeight: 1 }}>{Math.round(count).toLocaleString("en-US")}</p>
        <p style={small}>followers on X · @nova</p>
      </div>
      <span style={pill(accent)}>Follow</span>
    </div>
  );
}

export function TokenWidget({ accent }: { accent: string }) {
  return (
    <div style={frameStyle("large")}>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: 22, background: "linear-gradient(135deg,#9945FF,#14F195)" }} />
        <div>
          <p style={{ ...title, fontSize: 18 }}>Solana</p>
          <p style={small}>SOL</p>
        </div>
      </div>
      <p style={{ ...small, fontSize: 11, color: "rgba(255,255,255,0.75)" }}>“My main bag this cycle.”</p>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontFamily: MOGA, fontSize: 20, color: GREEN }}>+4.2%</p>
        <span style={pill(accent)}>Buy</span>
      </div>
    </div>
  );
}

/** "$FL3X LAUNCH" countdown, ticking every second of the video. */
export function CountdownWidget({ accent }: { accent: string }) {
  const f = useCurrentFrame();
  const left = 2 * 86400 + 16 * 3600 + 9 * 60 + 42 - Math.floor(f / 30);
  const parts = [Math.floor(left / 86400), Math.floor((left % 86400) / 3600), Math.floor((left % 3600) / 60), left % 60];
  return (
    <div style={frameStyle("long")}>
      <div style={{ display: "grid", gap: 6 }}>
        <p style={{ ...title, fontSize: 20 }}>
          <span style={{ color: accent }}>$FL3X</span> launch
        </p>
        <span style={{ ...pill(accent), alignSelf: "start", fontSize: 11, padding: "2px 10px" }}>Notify me</span>
      </div>
      <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
        {parts.map((v, i) => (
          <div key={i} style={{ width: 46, height: 56, borderRadius: 12, background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center" }}>
            <span style={{ fontFamily: MOGA, fontSize: 26, lineHeight: 1 }}>{String(v).padStart(2, "0")}</span>
            <span style={{ fontSize: 8, color: MUTED, marginTop: -8 }}>{["DAYS", "HRS", "MIN", "SEC"][i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const SpotifyMark = () => (
  <svg width="24" height="24" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="11" fill="#1DB954" />
    {[7.5, 11.5, 15].map((y, i) => (
      <path key={y} d={`M${6 + i} ${y} Q12 ${y - 2.6} ${18 - i} ${y + 0.6}`} stroke="#0b0b0b" strokeWidth={2 - i * 0.3} fill="none" strokeLinecap="round" />
    ))}
  </svg>
);
const DiscordMark = () => (
  <div style={{ width: 52, height: 52, borderRadius: 26, background: "rgba(255,255,255,0.12)", display: "grid", placeItems: "center" }}>
    <svg width="26" height="20" viewBox="0 0 26 20">
      <path d="M21.5 2.3A20 20 0 0 0 16.6.8l-.6 1.3a18 18 0 0 0-6 0L9.4.8A20 20 0 0 0 4.5 2.3 21 21 0 0 0 .9 16.4a20 20 0 0 0 6 3l1.3-2a13 13 0 0 1-2-1l.5-.4a14 14 0 0 0 12.6 0l.5.4-2 1 1.3 2a20 20 0 0 0 6-3 21 21 0 0 0-3.6-14.1ZM8.8 13.6c-1.2 0-2.2-1.1-2.2-2.5s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.5-2.2 2.5Zm8.4 0c-1.2 0-2.2-1.1-2.2-2.5s1-2.5 2.2-2.5 2.2 1.1 2.2 2.5-1 2.5-2.2 2.5Z" fill="rgba(255,255,255,0.55)" />
    </svg>
  </div>
);
export const XMark = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24">
    <path d="M17.8 2h3.4l-7.4 8.5L22.5 22h-6.8l-5.3-6.9L4.3 22H.9l7.9-9L.5 2h7l4.8 6.3L17.8 2Zm-1.2 18h1.9L6.5 3.9H4.5L16.6 20Z" fill="#fff" />
  </svg>
);

/** A widget by kind (the card places it; this only draws it). */
export function WidgetView({ kind, accent, followers }: { kind: WidgetKind; accent: string; followers?: number }): ReactNode {
  switch (kind) {
    case "pnl": return <PnlWidget accent={accent} />;
    case "music": return <MusicWidget accent={accent} />;
    case "community": return <CommunityWidget accent={accent} />;
    case "portfolio": return <PortfolioWidget />;
    case "nfts": return <NftWidget />;
    case "clock": return <ClockWidget />;
    case "followers": return <FollowersWidget accent={accent} count={followers} />;
    case "token": return <TokenWidget accent={accent} />;
    case "countdown": return <CountdownWidget accent={accent} />;
  }
}
export type WidgetKind = "pnl" | "music" | "community" | "portfolio" | "nfts" | "clock" | "followers" | "token" | "countdown";
