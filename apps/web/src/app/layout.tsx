import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontPrimary, fontSecondary } from "@/config/fonts";
import { site } from "@/config/site";
import { Providers } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name}: your on-chain identity`, template: `%s | ${site.name}` },
  description: site.description,
  applicationName: site.name,
  keywords: ["FL3X", "crypto profile", "on-chain identity", "link in bio", "Solana", "wallet PnL", "portfolio", "memecoin", "web3 profile", "crypto widgets"],
  // Icons come from app/icon.svg, app/favicon.ico and app/apple-icon.png; share images from app/opengraph-image.tsx.
  openGraph: { siteName: site.name, type: "website", locale: "en_US", title: `${site.name}: your on-chain identity`, description: site.description },
  twitter: { card: "summary_large_image", site: "@fl3xdotlol", creator: "@fl3xdotlol", title: `${site.name}: your on-chain identity`, description: site.description },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  appleWebApp: { title: site.name, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = { themeColor: "#000000" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${fontPrimary.variable} ${fontSecondary.variable}`}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
