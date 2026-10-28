"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { TagsIcon } from "@hugeicons/core-free-icons";
import { validateUsername } from "@fl3x/shared";
import { Button, Icon, Input } from "@/components/ui";
import { SocialLinks } from "@/components/shared/SocialLinks";

export function Hero() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  const claim = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateUsername(username);
    if (!check.valid) return setError(check.message);
    router.push(`/join?username=${encodeURIComponent(username)}`);
  };

  return (
    <section className="relative min-h-[calc(100svh-75px)]">
      <Image src="/images/backgrounds/hero-bg.png" alt="" fill priority className="object-cover object-center" />
      <div className="px-gutter relative flex min-h-[calc(100svh-75px)] flex-col justify-center py-16">
        <h1 className="mb-6 text-6xl md:text-7xl lg:text-8xl">PRove eveRythInG.</h1>
        <p className="mb-8 max-w-2xl text-lg text-fg-2 md:text-xl">
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
            error={error}
            leftElement={<span className="whitespace-nowrap text-fg-2">fl3x.lol/@</span>}
          />
          <Button type="submit" leftIcon={<Icon icon={TagsIcon} size={18} />}>
            Claim Now
          </Button>
        </form>
        <SocialLinks />
      </div>
    </section>
  );
}
