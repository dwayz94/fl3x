"use client";

import Link from "next/link";
import { V2_WIDGETS, WIDGETS, type WidgetSettings, type WidgetType } from "@fl3x/shared";
import { Brand } from "@/components/ui";
import { WidgetView } from "@/components/widgets";
import { DEMO_WIDGETS, demoWidget, resolveDemo } from "@/lib/demo";
import { DemoDataProvider } from "@/lib/use-data";

const categories = [
  { id: "crypto", label: "Crypto" },
  { id: "social", label: "Social" },
  { id: "media", label: "Media" },
  { id: "utility", label: "Utility" },
] as const;

const hasV2 = (t: WidgetType) => (V2_WIDGETS as readonly string[]).includes(t);

/** Large + long at the exact footprint of the profile grid: 80px cells, 12px gaps, 96px rows. */
function Pair({ type, settings, id }: { type: WidgetType; settings: WidgetSettings; id: string }) {
  return (
    <div className="flex flex-wrap items-start gap-3">
      <div className="h-[204px] w-[172px] shrink-0">
        <WidgetView w={demoWidget(type, "large", settings, `${id}-l`)} />
      </div>
      <div className="h-[96px] w-[356px] max-w-full shrink-0">
        <WidgetView w={demoWidget(type, "long", settings, `${id}-w`)} />
      </div>
    </div>
  );
}

/** Every widget side by side in both sizes, at the exact size they take on a profile. */
export function WidgetsGallery() {
  return (
    <DemoDataProvider resolve={resolveDemo}>
      <main className="min-h-svh bg-[#151515] px-4 py-12 md:px-10 md:py-16">
        <div className="mx-auto max-w-[1180px]">
          <header className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-primary text-5xl leading-none md:text-6xl">
                <Brand>{"Widg[e]ts"}</Brand>
              </h1>
              <p className="mt-3 max-w-md text-sm text-fg-2">
                Everything you can drop on your profile. Each widget comes in two sizes: large (square) and long (wide).
              </p>
            </div>
            <Link href="/example" className="rounded-xl bg-brand px-4 py-2 text-sm text-bg">
              See an example profile
            </Link>
          </header>

          {categories.map((c) => (
            <section key={c.id} className="mb-14">
              <h2 className="mb-5 font-primary text-3xl text-fg-2">{c.label}</h2>
              <div className="grid gap-4 lg:grid-cols-2">
                {DEMO_WIDGETS.map((d, i) => ({ d, i }))
                  .filter(({ d }) => WIDGETS[d.type].category === c.id)
                  .map(({ d, i }) => (
                    <article key={i} className="rounded-[32px] border border-white/[0.06] bg-[#1c1c1c] p-5">
                      <div className="mb-4 flex items-baseline justify-between gap-3">
                        <h3 className="font-primary text-xl leading-none">
                          {WIDGETS[d.type].name}
                          {d.label && <span className="ml-2 font-secondary text-xs text-fg-3">{d.label}</span>}
                        </h3>
                        <p className="truncate text-xs text-fg-3">{WIDGETS[d.type].description}</p>
                      </div>
                      {hasV2(d.type) ? (
                        <div className="flex flex-col gap-4">
                          {(["v1", "v2"] as const).map((v) => (
                            <div key={v}>
                              <p className={`mb-2 font-primary text-xs ${v === "v2" ? "text-brand" : "text-fg-3"}`}>{v.toUpperCase()}{v === "v2" && " · new"}</p>
                              <Pair type={d.type} settings={{ ...d.settings, style: v }} id={`g-${i}-${v}`} />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <Pair type={d.type} settings={d.settings} id={`g-${i}`} />
                      )}
                    </article>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </DemoDataProvider>
  );
}
