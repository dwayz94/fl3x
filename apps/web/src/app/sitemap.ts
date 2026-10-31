import type { MetadataRoute } from "next";
import { HELP_PAGES } from "@/components/help/content";
import { site } from "@/config/site";
import { POSTS } from "@/content/blog";
import { COMPARISONS } from "@/content/compare";
import { getExplore } from "@/lib/explore";

/** Rebuilt every hour so new profiles get in. */
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: [string, number][] = [
    ["/", 1],
    ["/join", 0.8],
    ["/explore", 0.8],
    ["/token", 0.7],
    ["/about", 0.6],
    ["/blog", 0.6],
    ["/changelog", 0.4],
    ["/terms", 0.2],
    ["/privacy", 0.2],
    ["/help", 0.5],
    ...HELP_PAGES.map((p): [string, number] => [`/help/${p.slug}`, 0.4]),
    ...POSTS.map((p): [string, number] => [`/blog/${p.slug}`, 0.6]),
    ...COMPARISONS.map((c): [string, number] => [`/vs/${c.slug}`, 0.6]),
  ];
  const profiles = await getExplore("new", 1000);
  return [
    ...pages.map(([path, priority]) => ({ url: `${site.url}${path}`, changeFrequency: "weekly" as const, priority })),
    ...profiles.map((p) => ({ url: `${site.url}/@${p.username}`, changeFrequency: "daily" as const, priority: 0.5 })),
  ];
}
