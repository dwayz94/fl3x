import Link from "next/link";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { Brand, buttonClass, Icon } from "@/components/ui";
import { Faq } from "./Faq";

export const faqs = [
  {
    q: "What makes FL3X different?",
    a: "We're built for web3. On-chain verification, live widgets that show your real crypto activity, and perks unlocked by holding the token, not just a list of links.",
  },
  {
    q: "How do I get in?",
    a: "FL3X is invite-only during pre-launch. Get an invite code from a member, or join the waitlist and we'll let you in before the public launch.",
  },
  {
    q: "How do tiers work?",
    a: "Every member gets a free profile, no token needed. Link a wallet holding $FL3X (on Solana) to unlock Starter or Premium: checked automatically, no subscription.",
  },
  {
    q: "How do I sign in?",
    a: "With your X account. Then link any wallets you like (Solana or EVM) to power your wallet widgets.",
  },
  {
    q: "Is my wallet safe?",
    a: "You only sign a message to prove ownership. No private keys, no seed phrases, no transactions.",
  },
];

export function WhyFl3x() {
  return (
    <section className="px-gutter py-24 md:py-40">
      <div className="flex flex-col gap-12 lg:flex-row lg:gap-16">
        <div className="flex-1">
          <h2 className="mb-4 text-5xl md:text-6xl">
            <Brand>WHY FL[3]X</Brand>
          </h2>
          <p className="mb-8 max-w-xl text-lg text-fg-2">
            While others offer basic link pages, FL3X delivers true on-chain profiles. Verified wallets, live widgets,
            holder perks. This is how web3 pros flex.
          </p>
          <Link href="/join" className={buttonClass()}>
            <Icon icon={SparklesIcon} size={20} />
            Ready to FL3X?
          </Link>
        </div>
        <div className="flex-1">
          <Faq items={faqs} />
        </div>
      </div>
    </section>
  );
}
