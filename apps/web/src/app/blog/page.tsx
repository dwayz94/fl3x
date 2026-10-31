import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight01Icon } from "@hugeicons/core-free-icons";
import { ArticlePage } from "@/components/shared/ArticlePage";
import { Icon } from "@/components/ui";
import { POSTS } from "@/content/blog";
import { fmtDate } from "@/content/dates";

const description = "Guides for crypto people: showing your portfolio, tracking your P&L, staying safe with your wallets.";

export const metadata: Metadata = {
  title: "Blog",
  description,
  alternates: { canonical: "/blog" },
  openGraph: { url: "/blog", title: "FL3X Blog", description },
};

export default function BlogPage() {
  const posts = [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <ArticlePage eyebrow="Blog" title="THE FL[3]X BL[o]G" intro={description}>
      <div className="grid gap-3">
        {posts.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="group flex items-center gap-6 rounded-3xl bg-surface p-6 transition-colors hover:bg-[#1d1d1d] md:p-8">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-fg-3">
                {p.tag} · <time dateTime={p.date}>{fmtDate(p.date)}</time>
              </p>
              <h2 className="mt-2 text-3xl leading-tight uppercase transition-colors group-hover:text-brand">{p.title}</h2>
              <p className="mt-2 text-fg-2">{p.description}</p>
            </div>
            <Icon icon={ArrowRight01Icon} size={22} className="hidden shrink-0 text-fg-3 transition-transform group-hover:translate-x-1 group-hover:text-brand sm:block" />
          </Link>
        ))}
      </div>
    </ArticlePage>
  );
}
