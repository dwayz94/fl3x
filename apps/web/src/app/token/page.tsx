import type { Metadata } from "next";
import { CopyField } from "@/components/dashboard/CopyField";
import { ArticlePage } from "@/components/shared/ArticlePage";
import { site } from "@/config/site";
import { fmtCompact } from "@/lib/format";
import { getPublicConfig } from "@/lib/server-api";

const description = "$FL3X is the FL3X token on Solana. Holding it unlocks Starter and Premium profiles: more widgets, fonts, animated backgrounds and a checkmark. No subscription.";

export const metadata: Metadata = {
  title: "$FL3X token",
  description,
  alternates: { canonical: "/token" },
  openGraph: { url: "/token", title: "The $FL3X token", description },
};

export default async function TokenPage() {
  const config = await getPublicConfig();
  const symbol = `$${config.token.symbol}`;
  const mint = config.token.mint;
  const { starter, premium } = config.thresholds;
  return (
    <ArticlePage
      eyebrow="Token"
      title="H[o]LD $FL[3]X"
      intro={description}
      sections={[
        { id: "tiers", heading: "What holding unlocks", blocks: [{ type: "tiers" }] },
        {
          id: "how",
          heading: "How it works",
          blocks: [
            {
              type: "steps",
              items: [
                "Link a Solana wallet that holds the token, from **Settings** or the [Plan](/dashboard/plan) page. You sign a free message, no transaction.",
                `Hold ${fmtCompact(starter)} ${symbol} for Starter, ${fmtCompact(premium)} for Premium. Balances of all your linked Solana wallets add up.`,
                "Your tier follows your balance: FL3X checks it every 5 minutes. Sell below a threshold and the tier goes back down.",
              ],
            },
            { type: "note", tone: "info", text: "Only Solana wallets count for tiers. EVM wallets still work in your widgets." },
          ],
        },
        {
          id: "safety",
          heading: "Stay safe",
          blocks: [
            {
              type: "list",
              items: [
                "The only official token address is the one on this page and on [@fl3xdotlol](" + site.social.x + ").",
                "FL3X will never DM you first, ask for your seed phrase or ask you to send funds.",
                "Holding the token is not an investment: it unlocks profile features, nothing more.",
              ],
            },
          ],
        },
      ]}
    >
      <section className="flex flex-col gap-4 rounded-3xl bg-surface p-6 md:p-8">
        <div className="flex items-center gap-2">
          <span className={mint ? "size-2 rounded-full bg-success" : "size-2 rounded-full bg-fg-3"} />
          <p className="text-sm text-fg-2">{mint ? `${symbol} is live on Solana` : `${symbol} hasn't launched yet`}</p>
        </div>
        {mint ? (
          <>
            <p className="text-xs text-fg-3">Official token address (CA)</p>
            <CopyField value={mint} />
            <a
              href={`https://jup.ag/swap/SOL-${mint}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 w-fit items-center rounded-xl bg-brand px-5 text-sm text-bg transition-[filter] hover:brightness-110"
            >
              Get {symbol} on Jupiter
            </a>
          </>
        ) : (
          <p className="leading-relaxed text-fg-2">
            Until launch, every profile is free. The official address will be posted here and on X the day it goes live: ignore any address you see before that.
          </p>
        )}
      </section>
    </ArticlePage>
  );
}
