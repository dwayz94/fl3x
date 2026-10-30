import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/** FL3X brand: same colors and faces as the site. */
export const PINK = "#FF97CB";
export const INK = "#FFFFFF";
export const BG = "#050505";
export const MUTED = "rgba(255,255,255,0.55)";
export const GREEN = "#2FE3AC";
export const RED = "#FF4D6D";

export const MOGA = "Moga";
export const OUTFIT = "Outfit";
void loadFont({ family: MOGA, url: staticFile("fonts/moga.otf") });
void loadFont({ family: OUTFIT, url: staticFile("fonts/Outfit-Regular.ttf") });

/** "PR[e]M[i]UM" → the bracketed letters in pink, like the site's titles. */
export function Brand({ children, color = PINK }: { children: string; color?: string }) {
  return (
    <>
      {children.split(/(\[[^\]]+\])/g).map((part, i) =>
        part.startsWith("[") ? (
          <span key={i} style={{ color }}>
            {part.slice(1, -1)}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

export const img = (path: string) => staticFile(`img/${path}`);
