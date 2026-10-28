import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

/** Centered card on the sign background, used by join / waitlist flows. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-col">
      <Image src="/images/backgrounds/sign-bg.png" alt="" fill priority className="object-cover" />
      <nav className="relative flex h-[75px] items-center px-4 md:px-20">
        <Link href="/" aria-label="FL3X home">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={100} height={35} />
        </Link>
      </nav>
      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[440px] rounded-[30px] border border-white/10 bg-black/60 p-8 backdrop-blur-xl">
          {children}
        </div>
      </div>
    </main>
  );
}
