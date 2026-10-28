"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ProfileView } from "@/components/profile/ProfileView";
import { backdropStyle } from "@/components/profile/theme";
import { DEMO_LAYOUTS, demoProfile, resolveDemo } from "@/lib/demo";
import { DemoDataProvider } from "@/lib/use-data";
import { cn } from "@/lib/cn";

/** A sample profile on an image background, with the Figma layout variants to flip through. */
export function ExampleProfile() {
  const [layout, setLayout] = useState(DEMO_LAYOUTS[0]!.id);
  const profile = demoProfile(DEMO_LAYOUTS.find((l) => l.id === layout)!.widgets);

  return (
    <DemoDataProvider resolve={resolveDemo}>
      <main className="flex min-h-svh flex-col items-center px-3 py-8 md:px-6 md:py-16" style={backdropStyle(profile.theme)}>
        <nav className="mb-8 flex flex-wrap justify-center gap-1 rounded-2xl bg-black/50 p-1 backdrop-blur" aria-label="Layout">
          {DEMO_LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setLayout(l.id)}
              className={cn("rounded-xl px-3 py-1.5 text-xs transition-colors", layout === l.id ? "bg-brand text-bg" : "text-fg-2 hover:text-fg")}
            >
              {l.label} · {l.widgets.length}
            </button>
          ))}
          <Link href="/widgets" className="rounded-xl px-3 py-1.5 text-xs text-fg-2 hover:text-fg">
            All widgets →
          </Link>
        </nav>
        <ProfileView profile={profile} tier={profile.tier} views={profile.views} />
        <Link href="/" className="mt-auto pt-12 opacity-50 transition-opacity hover:opacity-100" aria-label="Made with FL3X">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={64} height={22} />
        </Link>
      </main>
    </DemoDataProvider>
  );
}
