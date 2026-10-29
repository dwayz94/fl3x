import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { SocialLinks } from "./SocialLinks";

/**
 * Join / waitlist pages, as in the Figma: no card, a centered column on
 * the money-bag background, logo top left, socials top right, small footer.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh flex-col bg-bg">
      <Image src="/images/backgrounds/sign-bg.png" alt="" fill priority className="object-cover opacity-80" />
      <nav className="relative flex h-[75px] items-center justify-between px-4 md:px-20">
        <Link href="/" aria-label="FL3X home">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={88} height={31} />
        </Link>
        <SocialLinks />
      </nav>
      <div className="relative flex flex-1 items-center justify-center px-4 py-10">
        <div className="flex w-full max-w-[400px] flex-col items-center">{children}</div>
      </div>
      <footer className="relative flex h-16 items-center justify-between px-4 text-sm text-fg-3 md:px-20">
        <span className="font-primary">© {new Date().getFullYear()} FL3X</span>
        <Link href="/" className="hover:text-fg">
          fl3x.lol
        </Link>
      </footer>
    </main>
  );
}

/** Pink money bag + Moga title + muted subtitle, the header of every join step. */
export function AuthHeader({ title, subtitle }: { title: ReactNode; subtitle?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <Image src="/images/fl3x-icon.svg" alt="" width={56} height={60} className="mb-5" priority />
      <h1 className="text-4xl leading-none md:text-[44px]">{title}</h1>
      {subtitle && <p className="mt-3 max-w-[340px] text-fg-2">{subtitle}</p>}
    </div>
  );
}
