import type { MetadataRoute } from "next";
import { HELP_PAGES } from "@/components/help/content";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["/", 1],
    ["/join", 0.8],
    ["/terms", 0.2],
    ["/privacy", 0.2],
    ["/help", 0.5],
    ...HELP_PAGES.map((p): [string, number] => [`/help/${p.slug}`, 0.4]),
  ];
  return pages.map(([path, priority]) => ({ url: `${site.url}${path}`, changeFrequency: "weekly", priority }));
}
