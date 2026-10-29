import type { ProfileTheme } from "@fl3x/shared";

/** Page backdrops behind the profile card (the dark glows from the Figma backgrounds). */
export const backdrops: Record<Exclude<ProfileTheme["background"], "image">, string> = {
  plain: "#0b0b0b",
  pink: "radial-gradient(120% 80% at 50% 0%, #4a1f36 0%, #120a0f 55%, #050505 100%)",
  violet: "radial-gradient(120% 80% at 50% 0%, #2f1b4d 0%, #0d0a14 55%, #050505 100%)",
  red: "radial-gradient(120% 80% at 50% 0%, #4d1212 0%, #140808 55%, #050505 100%)",
  gold: "radial-gradient(120% 80% at 50% 0%, #4a3a12 0%, #141006 55%, #050505 100%)",
  teal: "radial-gradient(120% 80% at 50% 0%, #0f3d3a 0%, #071211 55%, #050505 100%)",
};

export function backdropStyle(theme: ProfileTheme): React.CSSProperties {
  if (theme.background === "image" && theme.backgroundUrl) {
    return { background: `#050505 url(${JSON.stringify(theme.backgroundUrl)}) center / cover no-repeat` };
  }
  return { background: backdrops[theme.background === "image" ? "plain" : theme.background] };
}

export const fontClass: Record<ProfileTheme["font"], string> = {
  moga: "font-primary",
  outfit: "font-secondary font-normal",
  mono: "font-mono",
  serif: "font-serif",
};

/** Classic pointer, 32px box, tip at (5, 3). */
const ARROW = "M5 3.6v21c0 .9 1.1 1.3 1.7.7l4.5-4.4 3.3 7.4c.2.5.8.7 1.3.5l2.5-1.1c.5-.2.7-.8.5-1.3l-3.3-7.3h6.3c.9 0 1.3-1.1.7-1.7L6.7 2.9C6.1 2.3 5 2.7 5 3.6z";
/** The 8-bit pointer as a bitmap: B outline, W fill. */
const PIXEL_ROWS = [
  "B", "BB", "BWB", "BWWB", "BWWWB", "BWWWWB", "BWWWWWB", "BWWWWWWB", "BWWWWWWWB", "BWWWWWWWWB",
  "BWWWWWBBBBB", "BWWBWWB", "BWB BWWB", "BB  BWWB", "B    BWWB", "     BWWB", "      BB",
];
const PIXEL_ARROW = PIXEL_ROWS.flatMap((row, y) =>
  [...row].map((c, x) => (c === " " ? "" : `<rect x="${x}" y="${y}" width="1" height="1" fill="${c === "B" ? "#000" : "#fff"}"/>`)),
).join("");
const SHADOW = `<filter id="s" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-opacity=".55"/></filter>`;

/**
 * SVG of each custom cursor with its hotspot. Each one has its own look;
 * only Neon follows the profile accent.
 */
export function cursorSvg(id: ProfileTheme["cursor"], accent: string): { svg: string; x: number; y: number } | null {
  const svg = (body: string, defs = "") => `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><defs>${SHADOW}${defs}</defs>${body}</svg>`;
  const arrow = (fill: string, stroke: string, extra = "") => `<path d="${ARROW}" fill="${fill}" stroke="${stroke}" stroke-width="1.6" stroke-linejoin="round" filter="url(#s)"/>${extra}`;
  switch (id) {
    case "classic":
      return { svg: svg(arrow("#fff", "#000")), x: 5, y: 3 };
    case "midnight":
      return { svg: svg(arrow("#0b0b0b", "#fff")), x: 5, y: 3 };
    case "pixel":
      return { svg: svg(`<g transform="translate(4 2) scale(1.6)" shape-rendering="crispEdges">${PIXEL_ARROW}</g>`), x: 4, y: 2 };
    case "solana":
      return {
        svg: svg(arrow("url(#g)", "#fff"), `<linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9945FF"/><stop offset=".55" stop-color="#19C3F0"/><stop offset="1" stop-color="#14F195"/></linearGradient>`),
        x: 5,
        y: 3,
      };
    case "gold":
      return {
        svg: svg(
          arrow("url(#g)", "#5a3b00", `<path d="M7.2 6.5v12.8" stroke="#fff8d6" stroke-width="1.4" stroke-linecap="round" opacity=".85"/>`),
          `<linearGradient id="g" x1="0" y1="0" x2=".8" y2="1"><stop offset="0" stop-color="#FFF1A8"/><stop offset=".45" stop-color="#F7C431"/><stop offset="1" stop-color="#A86F00"/></linearGradient>`,
        ),
        x: 5,
        y: 3,
      };
    case "glitch":
      return {
        svg: svg(
          `<path d="${ARROW}" fill="#FF2A6D" transform="translate(-1.6 .4)"/><path d="${ARROW}" fill="#05D9E8" transform="translate(1.6 -.4)"/><path d="${ARROW}" fill="#fff" stroke="#000" stroke-width="1.2" stroke-linejoin="round"/>`,
        ),
        x: 5,
        y: 3,
      };
    case "neon":
      return {
        svg: svg(
          `<path d="${ARROW}" fill="${accent}" fill-opacity=".18" stroke="${accent}" stroke-width="3" stroke-linejoin="round" filter="url(#n)"/><path d="${ARROW}" fill="none" stroke="#fff" stroke-width="1.1" stroke-linejoin="round"/>`,
          `<filter id="n" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>`,
        ),
        x: 5,
        y: 3,
      };
    case "diamond":
      return {
        svg: svg(
          `<g filter="url(#s)" stroke="#0b3a4a" stroke-width="1.2" stroke-linejoin="round"><path d="M9 5h14l5 7-12 16L4 12z" fill="#7DF3FF"/><path d="M4 12h24M9 5l3 7 4-7 4 7 3-7M12 12l4 16 4-16" fill="none"/></g><path d="M10.5 7.5l1.5 3" stroke="#fff" stroke-width="1.4" stroke-linecap="round"/>`,
        ),
        x: 16,
        y: 5,
      };
    case "rocket":
      // Drawn pointing up, turned to point at the top-left like a cursor.
      return {
        svg: svg(
          `<g transform="rotate(-45 16 16)" filter="url(#s)" stroke="#111" stroke-width="1.2" stroke-linejoin="round"><path d="M13.2 22h5.6L16 29z" fill="#FFB547"/><path d="M11 16l-4 5v3.5l4-2.5zM21 16l4 5v3.5l-4-2.5z" fill="#FF4D6D"/><path d="M16 2.5c4 3 5.5 8 5.5 13v6.5h-11V15.5c0-5 1.5-10 5.5-13z" fill="#F4F4F4"/><circle cx="16" cy="11.5" r="2.6" fill="#38BDF8"/></g>`,
        ),
        x: 7,
        y: 7,
      };
    case "flame":
      return {
        svg: svg(
          `<path d="M16 2c1 5 8 8.5 8 16a8 8 0 0 1-16 0c0-4 2-6.5 4-8.5 0 3 1.5 4.5 3 4.5C15 10 14.5 6 16 2z" fill="url(#g)" stroke="#5c1500" stroke-width="1.2" stroke-linejoin="round" filter="url(#s)"/><path d="M16 15c.5 2.5 4 4 4 7.5a4 4 0 0 1-8 0c0-2.5 2.5-3.5 4-7.5z" fill="#FFE27A"/>`,
          `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FF3D2E"/><stop offset="1" stop-color="#FF9A1F"/></linearGradient>`,
        ),
        x: 16,
        y: 2,
      };
    case "laser":
      return {
        svg: svg(
          `<circle cx="16" cy="16" r="9" fill="#FF1F3D" opacity=".18"/><circle cx="16" cy="16" r="5.5" fill="#FF1F3D" opacity=".35"/><circle cx="16" cy="16" r="3" fill="#FF1F3D" stroke="#fff" stroke-width="1"/>`,
        ),
        x: 16,
        y: 16,
      };
    case "scope":
      return {
        svg: svg(
          `<g filter="url(#s)" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"><circle cx="16" cy="16" r="10"/><path d="M16 2v7M16 23v7M2 16h7M23 16h7"/></g><circle cx="16" cy="16" r="1.8" fill="#FF1F3D"/>`,
        ),
        x: 16,
        y: 16,
      };
    default:
      return null;
  }
}

export function cursorStyle(theme: ProfileTheme): string | undefined {
  const c = cursorSvg(theme.cursor, theme.accent);
  if (!c) return undefined;
  return `url("data:image/svg+xml,${encodeURIComponent(c.svg)}") ${c.x} ${c.y}, auto`;
}
