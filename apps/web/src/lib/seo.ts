import type { Metadata } from "next";
import { site } from "@/config/site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;
type Twitter = NonNullable<Metadata["twitter"]>;

export const SITE_TITLE = `${site.name}: your on-chain identity`;

/** What every page shares by default (the root layout uses these as is). */
export const OG_DEFAULTS = { siteName: site.name, type: "website", locale: "en_US", title: SITE_TITLE, description: site.description } satisfies OpenGraph;
export const TWITTER_DEFAULTS = { card: "summary_large_image", site: "@fl3xdotlol", creator: "@fl3xdotlol", title: SITE_TITLE, description: site.description } satisfies Twitter;

// The site's share images (app/opengraph-image.tsx, app/twitter-image.tsx). A child segment that sets its own
// openGraph / twitter loses the root's file images (Next replaces the whole object), so they are named again here.
const SITE_OG_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: SITE_TITLE };
const SITE_TWITTER_IMAGE = { url: "/twitter-image", width: 1200, height: 630, alt: SITE_TITLE };

/**
 * openGraph + twitter for a page: Next doesn't deep-merge them with the root layout's,
 * so a page that sets either must give everything (site name, type, card…).
 * `ownImages`: the page's segment has its own opengraph-image / twitter-image files, which Next adds
 * only when `images` is left unset (/ and /u/[username]).
 */
export function shareMetadata({
  title = SITE_TITLE,
  description = site.description,
  url,
  ownImages = false,
  openGraph,
}: {
  title?: string;
  description?: string;
  url: string;
  ownImages?: boolean;
  /** Extra Open Graph fields (e.g. `type: "article"`, `publishedTime`). */
  openGraph?: Partial<OpenGraph>;
}): Pick<Metadata, "openGraph" | "twitter"> {
  return {
    openGraph: {
      ...OG_DEFAULTS,
      title,
      description,
      url,
      ...(ownImages ? {} : { images: [SITE_OG_IMAGE] }),
      ...openGraph,
    } as OpenGraph,
    twitter: { ...TWITTER_DEFAULTS, title, description, ...(ownImages ? {} : { images: [SITE_TWITTER_IMAGE] }) },
  };
}
