import localFont from "next/font/local";

/** Moga — headings */
export const fontPrimary = localFont({
  src: "../../public/fonts/primary/moga.otf",
  variable: "--font-moga",
  display: "swap",
  weight: "400",
});

/** Outfit — body (300) and buttons/containers (400) */
export const fontSecondary = localFont({
  src: [
    { path: "../../public/fonts/secondary/Outfit-Light.ttf", weight: "300", style: "normal" },
    { path: "../../public/fonts/secondary/Outfit-Regular.ttf", weight: "400", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});
