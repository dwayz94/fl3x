"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
  const taken = availability && availability !== "checking" && !availability.available;

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
      <div className="px-gutter relative grid min-h-[calc(100svh-75px)] items-center gap-12 py-16 xl:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col">
        <h1 className="mb-6 text-5xl md:text-6xl lg:text-7xl">PRove eveRythInG.</h1>
        <p className="mb-8 max-w-xl text-lg text-fg-2">
          With fl3x, you can verify on-chain data, display social links, showcase live widgets, personalize your page and
          track visitors.
        </p>
        <form onSubmit={claim} className="mb-8 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-start">
          <Input
            containerClassName="flex-1"
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
          <Button type="submit" leftIcon={<Icon icon={TagsIcon} size={18} />}>
            Claim Now
          </Button>
        </form>
        <SocialLinks />
        </div>
        {/* What their profile will look like; follows the name they type. */}
        <div className="hidden justify-center xl:flex" style={{ zoom: 0.72 }}>
          <HeroPreview username={availability && availability !== "checking" && availability.available ? name : undefined} />
        </div>
      </div>
    </section>
  );
}
