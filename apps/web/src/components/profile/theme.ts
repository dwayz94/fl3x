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

const svgCursor = (svg: string, x: number, y: number) => `url("data:image/svg+xml,${encodeURIComponent(svg)}") ${x} ${y}, auto`;

export function cursorStyle(theme: ProfileTheme): string | undefined {
  switch (theme.cursor) {
    case "dot":
      return svgCursor(`<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><circle cx="8" cy="8" r="5" fill="${theme.accent}" stroke="white" stroke-width="1.5"/></svg>`, 8, 8);
    case "crosshair":
      return "crosshair";
    case "arrow":
      return svgCursor(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><path d="M3 2l17 8-7 2-3 8z" fill="${theme.accent}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/></svg>`, 3, 2);
    default:
      return undefined;
  }
}
