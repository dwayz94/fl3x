import type { ReactNode } from "react";
import Link from "next/link";
import { SparklesIcon } from "@hugeicons/core-free-icons";
import { Block } from "@/components/help/Blocks";
import type { HelpSection } from "@/components/help/content";
import { Brand, buttonClass, Icon } from "@/components/ui";
import { getPublicConfig } from "@/lib/server-api";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

/**
 * Reading page for the marketing side (About, Token, Blog, comparisons, Changelog):
 * the legal pages' column, help blocks for the body, a join call at the end.
 */
export async function ArticlePage({
  eyebrow,
  title,
  intro,
  sections = [],
  children,
  jsonLd,
  cta = true,
}: {
  eyebrow?: ReactNode;
  /** Moga heading, [letters] in brackets turn pink. */
  title: string;
  intro?: ReactNode;
  sections?: HelpSection[];
  /** Extra content between the intro and the sections. */
  children?: ReactNode;
  jsonLd?: object;
  cta?: boolean;
}) {
  const config = await getPublicConfig();
  return (
    <main className="min-h-screen">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <Navbar />
      <div className="px-gutter">
        <article className="page-enter mx-auto flex max-w-[900px] flex-col gap-10 py-16 md:py-24">
          <header className="flex flex-col gap-4">
            {eyebrow && <div className="text-sm text-fg-3">{eyebrow}</div>}
            <h1 className="text-5xl leading-[0.95] md:text-6xl">
              <Brand>{title}</Brand>
            </h1>
            {intro && <div className="text-lg leading-relaxed text-fg-2">{intro}</div>}
          </header>
          {children}
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="flex scroll-mt-8 flex-col gap-4">
              <h2 className="target-title text-3xl leading-tight uppercase">{s.heading}</h2>
              {s.blocks.map((b, i) => (
                <Block key={i} block={b} config={config} />
              ))}
            </section>
          ))}
          {cta && (
            <div className="flex flex-col items-start gap-4 rounded-3xl bg-surface p-6 md:flex-row md:items-center md:justify-between md:p-8">
              <div>
                <p className="font-primary text-3xl leading-none">
                  <Brand>CLAIM YOUR N[a]ME</Brand>
                </p>
                <p className="mt-2 text-fg-2">Your profile at fl3x.lol/@you, free. Live widgets in minutes.</p>
              </div>
              <Link href="/join" className={buttonClass({ size: "md" })}>
                <Icon icon={SparklesIcon} size={18} />
                Get Started
              </Link>
            </div>
          )}
        </article>
      </div>
      <Footer />
    </main>
  );
}
