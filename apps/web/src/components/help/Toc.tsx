"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

// "On this page": smooth scroll on click, and an indicator that follows the
// section being read.

const ITEM_HEIGHT = 32;
const BRAND = "#ff97cb";

export function HelpToc({ sections }: { sections: { id: string; heading: string }[] }) {
  const [active, setActive] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((el): el is HTMLElement => Boolean(el));
    // A section is "current" once its top passes the upper part of the screen.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -55% 0px" },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const index = Math.max(
    0,
    sections.findIndex((s) => s.id === active),
  );

  return (
    <nav aria-label="On this page" className="flex flex-col gap-3">
      <span className="text-xs text-fg-3 uppercase">On this page</span>
      <div className="relative border-l border-white/10">
        <span
          aria-hidden
          className="absolute -left-px w-0.5 bg-brand transition-transform duration-300 ease-out"
          style={{ height: ITEM_HEIGHT, transform: `translateY(${index * ITEM_HEIGHT}px)` }}
        />
        {sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={(e) => {
              const el = document.getElementById(s.id);
              if (!el) return;
              e.preventDefault();
              el.scrollIntoView({ behavior: "smooth", block: "start" });
              history.replaceState(null, "", `#${s.id}`);
              setActive(s.id);
              // Brief pink on the heading so the eye lands on it.
              const heading = el.querySelector<HTMLElement>("[data-help-heading]");
              heading?.animate([{ color: BRAND }, { color: getComputedStyle(heading).color }], { duration: 1400, easing: "ease-out" });
            }}
            className={cn("flex items-center truncate pl-3 text-[13px] transition-colors duration-200", active === s.id ? "text-fg" : "text-fg-2 hover:text-fg")}
            style={{ height: ITEM_HEIGHT }}
          >
            <span className="truncate">{s.heading}</span>
          </a>
        ))}
      </div>
    </nav>
  );
}
