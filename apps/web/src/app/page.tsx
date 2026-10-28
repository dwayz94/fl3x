import { Footer, Navbar } from "@/components/shared";
import { FamousCreators, Hero, HolderTiers, WhyFl3x } from "@/components/landing";
import { getPublicConfig } from "@/lib/server-api";

export default async function LandingPage() {
  const config = await getPublicConfig();
  return (
    <main className="min-h-screen">
      <Navbar />
      <Hero />
      <FamousCreators />
      <HolderTiers config={config} />
      <WhyFl3x />
      <Footer />
    </main>
  );
}
