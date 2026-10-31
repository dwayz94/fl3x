import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticlePage } from "@/components/shared/ArticlePage";
import { COMPARISONS, findComparison } from "@/content/compare";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = findComparison((await params).slug);
  if (!c) return {};
  const path = `/vs/${c.slug}`;
  return {
    title: `FL3X vs ${c.name}`,
    description: c.description,
    alternates: { canonical: path },
    openGraph: { url: path, title: `FL3X vs ${c.name}`, description: c.description },
  };
}

export default async function Comparison({ params }: Props) {
  const c = findComparison((await params).slug);
  if (!c) notFound();
  return (
    <ArticlePage eyebrow="Compare" title={`FL[3]X VS ${c.name.toUpperCase()}`} intro={c.description} sections={c.sections}>
      <p className="leading-relaxed text-fg-2">{c.summary}</p>
      <div className="overflow-x-auto rounded-3xl bg-surface p-2 md:p-3">
        <table className="w-full min-w-[520px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-[44%] p-3 text-left font-normal text-fg-3" />
              <th className="rounded-t-2xl bg-brand/[0.08] p-3 font-primary text-xl font-normal">FL3X</th>
              <th className="p-3 font-primary text-xl font-normal">{c.name.toUpperCase()}</th>
            </tr>
          </thead>
          <tbody>
            {c.rows.map(([label, us, them], i) => (
              <tr key={label}>
                <td className="border-t border-white/[0.06] p-3 text-fg-2">{label}</td>
                <td className={`border-t border-white/[0.06] bg-brand/[0.08] p-3 text-center ${i === c.rows.length - 1 ? "rounded-b-2xl" : ""}`}>{us}</td>
                <td className="border-t border-white/[0.06] p-3 text-center text-fg-2">{them}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-fg-3">Based on each product&apos;s public features at the time of writing. Check their site for the latest.</p>
    </ArticlePage>
  );
}
