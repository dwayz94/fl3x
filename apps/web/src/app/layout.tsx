import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontPrimary, fontSecondary } from "@/config/fonts";
import { site } from "@/config/site";
import { Providers } from "@/components/auth/AuthProvider";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  openGraph: { siteName: site.name, type: "website" },
  twitter: { card: "summary_large_image", site: "@fl3xdotlol" },
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
