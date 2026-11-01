import localFont from "next/font/local";

/** Moga — headings */
export const fontPrimary = localFont({
  src: "../../public/fonts/primary/moga.woff2",
  variable: "--font-moga",
  display: "swap",
  weight: "400",
});

/** Outfit — body (300) and buttons/containers (400) */
export const fontSecondary = localFont({
  src: [
    { path: "../../public/fonts/secondary/Outfit-Light.woff2", weight: "300", style: "normal" },
    { path: "../../public/fonts/secondary/Outfit-Regular.woff2", weight: "400", style: "normal" },
  ],
  variable: "--font-outfit",
  display: "swap",
});
