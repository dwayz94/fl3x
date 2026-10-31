import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/shared/ArticlePage";
import { site } from "@/config/site";
import { findPost, POSTS } from "@/content/blog";
import { fmtDate } from "@/content/dates";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = findPost((await params).slug);
  if (!post) return {};
  const path = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: path },
    openGraph: { type: "article", url: path, title: post.title, description: post.description, publishedTime: post.date },
  };
}

export default async function BlogPost({ params }: Props) {
  const post = findPost((await params).slug);
  if (!post) notFound();
  return (
    <ArticlePage
      eyebrow={
        <>
          <Link href="/blog" className="transition-colors hover:text-brand">
            Blog
          </Link>{" "}
          · {post.tag} · <time dateTime={post.date}>{fmtDate(post.date)}</time>
        </>
      }
      title={post.title.toUpperCase()}
      intro={post.description}
      sections={post.sections}
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        description: post.description,
        datePublished: post.date,
        url: `${site.url}/blog/${post.slug}`,
        author: { "@id": `${site.url}/#org` },
        publisher: { "@id": `${site.url}/#org` },
      }}
    />
  );
}
