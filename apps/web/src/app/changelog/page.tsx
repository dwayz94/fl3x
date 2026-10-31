import type { Metadata } from "next";
import { ArticlePage } from "@/components/shared/ArticlePage";
import { CHANGELOG } from "@/content/changelog";
import { fmtDate } from "@/content/dates";
import { shareMetadata } from "@/lib/seo";

const description = "Everything new on FL3X: widgets, features and fixes, newest first.";

export const metadata: Metadata = {
  title: "Changelog",
  description,
  alternates: { canonical: "/changelog" },
  ...shareMetadata({ url: "/changelog", title: "FL3X Changelog", description }),
};

export default function ChangelogPage() {
  return (
    <ArticlePage eyebrow="Changelog" title="WH[a]T'S NEW" intro={description}>
      <ol className="flex flex-col">
        {CHANGELOG.map((e, i) => (
          <li key={`${e.date}-${i}`} className="grid gap-3 border-t border-white/10 py-8 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8">
            <time dateTime={e.date} className="text-sm text-fg-3">
              {fmtDate(e.date)}
            </time>
            <div>
              <h2 className="text-3xl leading-tight uppercase">{e.title}</h2>
              <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 leading-relaxed text-fg-2">
                {e.items.map((it) => (
                  <li key={it} className="pl-1">
                    {it}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ol>
    </ArticlePage>
  );
}
