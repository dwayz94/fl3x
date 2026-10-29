import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/dev", "/api/", "/invite/", "/x-kit/"] },
    sitemap: `${site.url}/sitemap.xml`,
    host: site.url,
  };
}
