import type { Metadata } from "next";
import Link from "next/link";
import { Footer, Navbar } from "@/components/shared";
import { Brand, Verified } from "@/components/ui";
import { cn } from "@/lib/cn";
import { getExplore } from "@/lib/explore";
import { fmtCompact } from "@/lib/format";
import { shareMetadata } from "@/lib/seo";

const description = "Discover crypto traders, creators and builders on FL3X: live portfolios, P&L, tokens and communities.";

export const metadata: Metadata = {
  title: "Explore profiles",
  description,
  alternates: { canonical: "/explore" },
  ...shareMetadata({ url: "/explore", title: "Explore FL3X profiles", description }),
};

const TABS = [
  { id: "popular", label: "Most viewed" },
  { id: "new", label: "Newest" },
] as const;

type Props = { searchParams: Promise<{ sort?: string }> };

export default async function ExplorePage({ searchParams }: Props) {
  const sort = (await searchParams).sort === "new" ? "new" : "popular";
  const profiles = await getExplore(sort);
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="px-gutter">
        <div className="page-enter mx-auto flex max-w-[1200px] flex-col gap-10 py-16 md:py-24">
          <header className="flex flex-col gap-4">
            <h1 className="text-5xl leading-[0.95] md:text-6xl">
              <Brand>{"EXPL[o]RE"}</Brand>
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-fg-2">{description}</p>
          </header>

          <nav className="flex gap-2">
            {TABS.map((t) => (
              <Link
                key={t.id}
                href={t.id === "popular" ? "/explore" : "/explore?sort=new"}
                scroll={false}
                className={cn("h-10 rounded-xl px-4 text-sm leading-10 transition-colors", sort === t.id ? "bg-brand text-bg" : "bg-white/[0.06] text-fg-2 hover:bg-white/[0.1]")}
              >
                {t.label}
              </Link>
            ))}
          </nav>

          {profiles.length === 0 ? (
            <p className="rounded-3xl bg-surface p-8 text-fg-2">No profiles to show yet. Come back soon.</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {profiles.map((p) => (
                <li key={p.username}>
                  <Link href={`/@${p.username}`} className="group flex h-full items-center gap-4 rounded-3xl bg-surface p-4 transition-colors hover:bg-[#1d1d1d]">
                    <span className="size-16 shrink-0 overflow-hidden rounded-full bg-white/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.avatarUrl && <img src={p.avatarUrl} alt="" loading="lazy" className="size-full object-cover" />}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-primary text-2xl leading-none transition-colors group-hover:text-brand">{p.displayName || p.username}</span>
                        {p.verified && <Verified size={16} />}
                      </span>
                      <span className="truncate text-xs text-fg-3">
                        @{p.username}
                        {p.views > 0 && ` · ${fmtCompact(p.views)} views this month`}
                      </span>
                      {p.bio && <span className="line-clamp-2 text-sm text-fg-2">{p.bio}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <Footer />
    </main>
  );
}
