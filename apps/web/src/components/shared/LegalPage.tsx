import type { ReactNode } from "react";
import { Brand } from "@/components/ui";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export const LEGAL_UPDATED = "October 29, 2026";
export const LEGAL_EMAIL = "support@fl3x.lol";

/** Terms and privacy pages: one readable column, numbered sections with anchors. */
export function LegalPage({ title, intro, sections }: { title: string; intro: ReactNode; sections: { id: string; title: string; body: ReactNode }[] }) {
  return (
    <main className="min-h-screen">
      <Navbar />
      {/* Gutter outside, width cap inside: the gutter must not eat into the reading column. */}
      <div className="px-gutter">
      <article className="page-enter mx-auto max-w-[900px] py-16 md:py-24">
        <p className="text-sm text-fg-3">Last updated {LEGAL_UPDATED}</p>
        <h1 className="mt-2 text-5xl md:text-6xl">
          <Brand>{title}</Brand>
        </h1>
        <div className="mt-6 text-lg leading-relaxed text-fg-2">{intro}</div>

        <nav className="mt-10 rounded-3xl bg-white/[0.04] p-6">
          <p className="mb-3 text-xs text-fg-3 uppercase">Contents</p>
          <ol className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-fg-2 transition-colors hover:text-brand">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-12 flex flex-col gap-12">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28">
              <h2 className="target-title text-3xl uppercase">
                <span className="text-brand">{i + 1}.</span> {s.title}
              </h2>
              <div className="mt-4 flex flex-col gap-4 leading-relaxed text-fg-2 [&_a]:text-brand [&_a]:underline-offset-2 hover:[&_a]:underline [&_li]:pl-1 [&_strong]:font-normal [&_strong]:text-fg [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </article>
      </div>
      <Footer />
    </main>
  );
}
