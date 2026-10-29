import type { Metadata } from "next";
import { Footer, Navbar } from "@/components/shared";
import { FamousCreators, Hero, HolderTiers, StatusBanner, WhyFl3x } from "@/components/landing";
import { site } from "@/config/site";
import { getPublicConfig } from "@/lib/server-api";

export const metadata: Metadata = {
  // The home page carries the brand line in the tab instead of "… | FL3X".
  title: { absolute: `${site.name}: your on-chain identity` },
  alternates: { canonical: "/" },
  openGraph: { url: "/" },
};

/** What search engines read about FL3X itself (the brand and the site). */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${site.url}/#org`,
      name: site.name,
      url: site.url,
      logo: `${site.url}/icon-512.png`,
      sameAs: [site.social.x, site.social.discord, site.social.telegram],
    },
    { "@type": "WebSite", "@id": `${site.url}/#site`, name: site.name, url: site.url, description: site.description, publisher: { "@id": `${site.url}/#org` } },
  ],
};

export default async function LandingPage() {
  const config = await getPublicConfig();
  return (
    <main className="min-h-screen">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <StatusBanner config={config} />
      <Hero />
      <FamousCreators />
      <HolderTiers config={config} />
      <WhyFl3x />
      <Footer />
    </main>
  );
}
