"use client";

import Image from "next/image";
import Link from "next/link";
import { Analytics01Icon, SparklesIcon } from "@hugeicons/core-free-icons";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { buttonClass, Icon } from "@/components/ui";

export function Navbar() {
  const { authenticated } = useAuth();
  const { data: me } = useMe();
  const member = authenticated && me?.username;

  return (
    <nav className="flex h-[75px] w-full items-center justify-between px-4 md:px-20">
      <Link href="/" className="shrink-0" aria-label="FL3X home">
        <Image src="/images/fl3x-logo.svg" alt="FL3X" width={100} height={35} priority />
      </Link>
      <Link href={member ? "/dashboard" : "/join"} className={buttonClass({ size: "md" })}>
        <Icon icon={member ? Analytics01Icon : SparklesIcon} size={18} />
        {member ? "Dashboard" : "Get Started"}
      </Link>
    </nav>
  );
}
