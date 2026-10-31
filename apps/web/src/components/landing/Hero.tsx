"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { CheckmarkCircle02Icon, Loading03Icon, TagsIcon } from "@hugeicons/core-free-icons";
import { validateUsername } from "@fl3x/shared";
import { Button, Icon, Input } from "@/components/ui";
import { SocialLinks } from "@/components/shared/SocialLinks";
import { useAvailability } from "@/lib/use-availability";
import { HeroPreview } from "./HeroPreview";

export function Hero() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const name = username.trim().toLowerCase();
  const availability = useAvailability(name);
  // A failed check doesn't block: /join checks the name again.
  const taken = availability && availability !== "checking" && !availability.available && !availability.error;

  const claim = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateUsername(username);
    if (!check.valid) return setError(check.message);
    if (taken) return setError(availability.reason ?? "This username is already taken");
    router.push(`/join?username=${encodeURIComponent(username)}`);
  };

  return (
    <section className="relative min-h-[calc(100svh-75px)]">
      <Image src="/images/backgrounds/hero-bg.png" alt="" fill priority className="object-cover object-center" />
      <div className="px-gutter relative grid min-h-[calc(100svh-75px)] items-center gap-12 py-16 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <div className="flex min-w-0 flex-col">
        <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl">PRove eveRythInG.</h1>
        <p className="mb-4 max-w-xl text-lg text-fg-2">
          With fl3x, you can verify on-chain data, display social links, showcase live widgets, personalize your page and
          track visitors.
        </p>
        <p className="mb-8 flex items-center gap-2 text-sm text-success">
          <span className="size-1.5 rounded-full bg-success" />
          Free to start, no token needed. Holding $FL3X unlocks more.
        </p>
        <form onSubmit={claim} className="mb-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-start">
          <Input
            containerClassName="min-w-0 flex-1"
            placeholder="username"
            value={username}
            maxLength={20}
            autoCapitalize="none"
            spellCheck={false}
            onChange={(e) => {
              setUsername(e.target.value);
              if (error) setError(null);
            }}
            error={error ?? (taken ? availability.reason : null)}
            leftElement={<span className="whitespace-nowrap text-fg-2">fl3x.lol/@</span>}
            rightElement={
              availability === "checking" ? (
                <Icon icon={Loading03Icon} size={18} className="animate-spin text-fg-3" />
              ) : availability?.available ? (
                <span className="flex items-center gap-1 text-xs text-success">
                  <Icon icon={CheckmarkCircle02Icon} size={16} />
                  Available
                </span>
              ) : null
            }
          />
          <Button type="submit" className="shrink-0" leftIcon={<Icon icon={TagsIcon} size={18} />}>
            Claim Now
          </Button>
        </form>
        <SocialLinks />
        </div>
        {/* What their profile will look like; follows the name they type. */}
        {/* Bigger than the text column on purpose; only a slight bleed toward the right edge. */}
        <div className="hidden min-w-0 justify-center xl:flex xl:-mr-[calc(var(--gutter)/2)]">
          <FitWidth max={0.92}>
            <HeroPreview username={availability && availability !== "checking" && availability.available ? name : undefined} />
          </FitWidth>
        </div>
      </div>
    </section>
  );
}

/**
 * Scales its child down to the column's width (never above `max`), so the card
 * shrinks with the window or the browser zoom instead of covering the form.
 * Measured before the first paint and hidden until then: no visible jump on load.
 * (Hidden, not faded: a translucent ancestor would switch off the card's backdrop blur.)
 */
function FitWidth({ max, children }: { max: number; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ scale: max, width: 0, height: 0 });

  useLayoutEffect(() => {
    const cell = box.current?.parentElement;
    const el = inner.current;
    if (!cell || !el) return;
    const update = () => {
      // offsetWidth/Height ignore transforms: the card's natural size.
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (!width) return;
      const scale = Math.min(max, cell.clientWidth / width);
      setFit({ scale, width: width * scale, height: height * scale });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(cell);
    ro.observe(el);
    return () => ro.disconnect();
  }, [max]);

  return (
    <div ref={box} style={fit.width ? { width: fit.width, height: fit.height } : { visibility: "hidden" }}>
      <div ref={inner} className="w-max origin-top-left" style={{ transform: `scale(${fit.scale})` }}>
        {children}
      </div>
    </div>
  );
}
