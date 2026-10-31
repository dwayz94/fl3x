import type { Metadata } from "next";
import { TIER_LIMITS } from "@fl3x/shared";
import { ArticlePage } from "@/components/shared/ArticlePage";
import { site } from "@/config/site";
import { shareMetadata } from "@/lib/seo";

const description = "FL3X is a profile made of live widgets for crypto people: verified wallets, real numbers, your communities and your content at fl3x.lol/@you.";

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  ...shareMetadata({ url: "/about", title: "About FL3X", description }),
};

export default function AboutPage() {
  return (
    <ArticlePage
      eyebrow="About"
      title="FL[3]X IS Y[o]UR ON-CHAIN IDENT[i]TY"
      intro={description}
      jsonLd={{ "@context": "https://schema.org", "@type": "AboutPage", url: `${site.url}/about`, name: "About FL3X", description, publisher: { "@id": `${site.url}/#org` } }}
      sections={[
        {
          id: "why",
          heading: "Why we built it",
          blocks: [
            { type: "p", text: "Crypto people live on X, in Discord servers and in their wallets. A list of links can't show any of that: what you hold, what you trade, the communities you run, the token you launched." },
            { type: "p", text: "FL3X is one page that does. Every widget reads live data, so what people see is what's true right now, not a screenshot from last week." },
          ],
        },
        {
          id: "what",
          heading: "What you get",
          blocks: [
            {
              type: "list",
              items: [
                "**Live widgets**: portfolio, P&L, holdings, NFTs, tokens, Hyperliquid, Polymarket, music, videos, communities and more. [See them all](/help/widgets).",
                "**Verified wallets**: you prove each wallet is yours by signing a free message. Visitors see totals, never your addresses.",
                "**Badges**: earned by holding, inviting and being early.",
                "**Analytics**: who visits your page and what they click.",
              ],
            },
          ],
        },
        {
          id: "free",
          heading: "Free, with perks for holders",
          blocks: [
            { type: "p", text: `Every profile is free, with ${TIER_LIMITS.none.widgets} widgets and ${TIER_LIMITS.none.links} links. Holding $FL3X unlocks Starter and Premium: more widgets, custom fonts and cursors, animated and video backgrounds, a checkmark. No subscription. [How the token works](/token).` },
          ],
        },
        {
          id: "contact",
          heading: "Talk to us",
          blocks: [
            { type: "p", text: `Follow [@fl3xdotlol](${site.social.x}) on X for news, read the [Help Center](/help) or write to [support@fl3x.lol](mailto:support@fl3x.lol).` },
          ],
        },
      ]}
    />
  );
}
