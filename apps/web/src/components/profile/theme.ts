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

/** SVG of each custom cursor, drawn in the profile accent, with its hotspot. */
export function cursorSvg(id: ProfileTheme["cursor"], accent: string): { svg: string; x: number; y: number } | null {
  const o = `stroke="white" stroke-width="1.5" stroke-linejoin="round"`;
  const svg = (size: number, body: string) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${body}</svg>`;
  switch (id) {
    case "arrow":
      return { svg: svg(24, `<path d="M3 2l17 8-7 2-3 8z" fill="${accent}" ${o}/>`), x: 3, y: 2 };
    case "pixel":
      return {
        svg: svg(24, `<path d="M2 2h3v3h3v3h3v3h3v3h3v3h-6v3h-3v3H5v-3H2z" fill="${accent}" stroke="black" stroke-width="1.5" shape-rendering="crispEdges"/>`),
        x: 2,
        y: 2,
      };
    case "dot":
      return { svg: svg(16, `<circle cx="8" cy="8" r="5" fill="${accent}" stroke="white" stroke-width="1.5"/>`), x: 8, y: 8 };
    case "ring":
      return { svg: svg(28, `<circle cx="14" cy="14" r="10" fill="none" stroke="${accent}" stroke-width="2.5"/><circle cx="14" cy="14" r="2" fill="white"/>`), x: 14, y: 14 };
    case "crosshair":
      return {
        svg: svg(24, `<g stroke="${accent}" stroke-width="2" stroke-linecap="round"><path d="M12 2v6M12 16v6M2 12h6M16 12h6"/></g><circle cx="12" cy="12" r="1.5" fill="white"/>`),
        x: 12,
        y: 12,
      };
    case "heart":
      return { svg: svg(24, `<path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="${accent}" ${o}/>`), x: 12, y: 12 };
    case "star":
      return { svg: svg(24, `<path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" fill="${accent}" ${o}/>`), x: 12, y: 12 };
    case "coin":
      return {
        svg: svg(24, `<circle cx="12" cy="12" r="9" fill="${accent}" ${o}/><text x="12" y="16.5" font-size="12" font-family="Arial" font-weight="bold" text-anchor="middle" fill="black">$</text>`),
        x: 12,
        y: 12,
      };
    case "sparkle":
      return { svg: svg(24, `<path d="M12 1l2.5 8.5L23 12l-8.5 2.5L12 23l-2.5-8.5L1 12l8.5-2.5z" fill="${accent}" ${o}/>`), x: 12, y: 12 };
    default:
      return null;
  }
}

export function cursorStyle(theme: ProfileTheme): string | undefined {
  if (theme.cursor === "default") return undefined;
  const c = cursorSvg(theme.cursor, theme.accent);
  if (!c) return undefined;
  return `url("data:image/svg+xml,${encodeURIComponent(c.svg)}") ${c.x} ${c.y}, ${theme.cursor === "crosshair" ? "crosshair" : "auto"}`;
}
