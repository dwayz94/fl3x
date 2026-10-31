import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight01Icon, Mail01Icon } from "@hugeicons/core-free-icons";
import { HELP_GROUPS } from "@/components/help/content";
import { Brand, Icon } from "@/components/ui";
import { shareMetadata } from "@/lib/seo";

const description =
  "How FL3X works: claiming your name, invites, widgets, links, wallets, tiers and $FL3X, referrals, analytics and your account.";

export const metadata: Metadata = {
  title: "Help Center",
  description,
  alternates: { canonical: "/help" },
  ...shareMetadata({ url: "/help", title: "Help Center | FL3X", description }),
};

export default function HelpHome() {
  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-col gap-5">
        <h1 className="text-5xl leading-[0.9] md:text-6xl">
          <Brand>H[e]LP C[e]NT[e]R</Brand>
        </h1>
        <p className="max-w-[560px] text-lg leading-relaxed text-fg-2">
          Everything about your FL3X profile: getting in, widgets and links, wallets, tiers and your account.
        </p>
      </div>

      {HELP_GROUPS.map((group) => (
        <section key={group.title} className="flex flex-col gap-4">
          <h2 className="text-xs text-fg-3 uppercase font-secondary">{group.title}</h2>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {group.pages.map((page) => (
              <Link key={page.slug} href={`/help/${page.slug}`} className="group flex flex-col gap-2 rounded-2xl bg-surface p-5 transition-colors hover:bg-[#1d1d1d]">
                <span className="flex items-center justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-white/[0.05] text-fg transition-colors group-hover:text-brand">
                    <Icon icon={page.icon} size={20} />
                  </span>
                  <Icon icon={ArrowRight01Icon} size={18} className="text-fg-3 transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
                </span>
                <span className="mt-2 font-primary text-2xl leading-none">{page.title}</span>
                <span className="text-sm leading-[1.5] text-fg-2">{page.description}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}

      <a href="mailto:support@fl3x.lol" className="group flex items-center gap-4 rounded-2xl bg-surface p-5 transition-colors hover:bg-[#1d1d1d]">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-fg transition-colors group-hover:text-brand">
          <Icon icon={Mail01Icon} size={20} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="font-primary text-2xl leading-none">Still stuck?</span>
          <span className="text-sm text-fg-2">Write to support@fl3x.lol with your handle and what you see.</span>
        </span>
        <Icon icon={ArrowRight01Icon} size={18} className="shrink-0 text-fg-3 transition-transform group-hover:translate-x-0.5 group-hover:text-fg" />
      </a>
    </div>
  );
}
