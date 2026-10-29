import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [
    ["/", 1],
    ["/join", 0.8],
    ["/widgets", 0.6],
    ["/example", 0.6],
    ["/terms", 0.2],
    ["/privacy", 0.2],
  ];
  return pages.map(([path, priority]) => ({ url: `${site.url}${path}`, changeFrequency: "weekly", priority }));
}
