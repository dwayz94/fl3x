"use client";

import { notFound } from "next/navigation";
import { VISUALS } from "@/components/x-kit/visuals";

export function XKitCanvas({ slug }: { slug: string }) {
  const visual = VISUALS[slug];
  if (!visual) notFound();
  return (
    <div style={{ width: visual.width, height: visual.height }} className="overflow-hidden">
      {/* Hide the Next.js dev badge from the captures. */}
      <style>{"nextjs-portal{display:none!important}"}</style>
      {visual.render()}
    </div>
  );
}
