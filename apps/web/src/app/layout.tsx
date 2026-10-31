import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontPrimary, fontSecondary } from "@/config/fonts";
import { site } from "@/config/site";
import { Providers } from "@/components/auth/AuthProvider";
import { OG_DEFAULTS, SITE_TITLE, TWITTER_DEFAULTS } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: SITE_TITLE, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["FL3X", "crypto profile", "on-chain identity", "link in bio", "Solana", "wallet PnL", "portfolio", "memecoin", "web3 profile", "crypto widgets"],
  // Icons come from app/icon.svg, app/favicon.ico and app/apple-icon.png; share images from app/opengraph-image.tsx.
  // Pages that set their own openGraph / twitter go through shareMetadata (lib/seo), which starts from these.
  openGraph: OG_DEFAULTS,
  twitter: TWITTER_DEFAULTS,
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  appleWebApp: { title: site.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${fontPrimary.variable} ${fontSecondary.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
