import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft01Icon, ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { Block } from "@/components/help/Blocks";
import { findHelp, HELP_PAGES } from "@/components/help/content";
import { HelpFade } from "@/components/help/Fade";
import { HelpToc } from "@/components/help/Toc";
import { Icon } from "@/components/ui";
import { getPublicConfig } from "@/lib/server-api";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return HELP_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = findHelp((await params).slug);
  if (!doc) return {};
  const path = `/help/${doc.page.slug}`;
  return {
    title: doc.page.title,
    description: doc.page.description,
    alternates: { canonical: path },
    openGraph: { url: path, title: `${doc.page.title} | FL3X Help`, description: doc.page.description },
  };
}

export default async function HelpArticle({ params }: Props) {
  const doc = findHelp((await params).slug);
  if (!doc) notFound();
  const { page, group, prev, next } = doc;
  // Live thresholds and token symbol for the tiers table (cached, with a fallback).
  const config = await getPublicConfig();

  return (
    <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_200px]">
      <HelpFade id={page.slug} className="min-w-0">
        <article className="flex max-w-[720px] min-w-0 flex-col gap-10">
          <header className="flex flex-col gap-4 border-b border-white/10 pb-8">
            <span className="text-xs text-fg-3 uppercase">{group}</span>
            <span className="flex size-12 items-center justify-center rounded-xl bg-surface text-brand">
              <Icon icon={page.icon} size={24} />
            </span>
            <h1 className="text-4xl leading-[0.9] uppercase md:text-5xl">{page.title}</h1>
            <p className="text-lg leading-[1.5] text-fg-2">{page.description}</p>
          </header>

          {page.sections.map((section) => (
            <section key={section.id} id={section.id} className="flex scroll-mt-8 flex-col gap-4">
              <h2 data-help-heading className="text-2xl leading-tight uppercase md:text-3xl">
                <a href={`#${section.id}`} className="transition-colors hover:text-brand">
                  {section.heading}
                </a>
              </h2>
              {section.blocks.map((block, i) => (
                <Block key={i} block={block} config={config} />
              ))}
            </section>
          ))}

          <nav className="grid gap-2 border-t border-white/10 pt-8 sm:grid-cols-2" aria-label="Pagination">
            {prev ? (
              <Link href={`/help/${prev.slug}`} className="flex flex-col gap-1 rounded-2xl bg-surface p-4 transition-colors hover:bg-[#1d1d1d]">
                <span className="flex items-center gap-1 text-xs text-fg-3">
                  <Icon icon={ArrowLeft01Icon} size={14} /> Previous
                </span>
                <span className="flex items-center gap-2">
                  <Icon icon={prev.icon} size={18} className="shrink-0 text-brand" />
                  {prev.title}
                </span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {next && (
              <Link href={`/help/${next.slug}`} className="flex flex-col items-end gap-1 rounded-2xl bg-surface p-4 text-right transition-colors hover:bg-[#1d1d1d]">
                <span className="flex items-center gap-1 text-xs text-fg-3">
                  Next <Icon icon={ArrowRight01Icon} size={14} />
                </span>
                <span className="flex items-center gap-2">
                  {next.title}
                  <Icon icon={next.icon} size={18} className="shrink-0 text-brand" />
                </span>
              </Link>
            )}
          </nav>
        </article>
      </HelpFade>

      <aside className="hidden self-start xl:sticky xl:top-8 xl:block">
        <HelpToc key={page.slug} sections={page.sections.map(({ id, heading }) => ({ id, heading }))} />
      </aside>
    </div>
  );
}
