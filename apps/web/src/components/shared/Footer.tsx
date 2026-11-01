import Image from "next/image";
import Link from "next/link";
import { Brand } from "@/components/ui";
import { SocialLinks } from "./SocialLinks";

const columns = [
  {
    title: "FL[3]X",
    links: [
      { label: "About", href: "/about" },
      { label: "Explore", href: "/explore" },
      { label: "Token", href: "/token" },
      { label: "Tiers", href: "/#tiers" },
      { label: "Join", href: "/join" },
    ],
  },
  {
    title: "RES[o]URCES",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Changelog", href: "/changelog" },
      { label: "FL3X vs Linktree", href: "/vs/linktree" },
      { label: "FL3X vs Carrd", href: "/vs/carrd" },
    ],
  },
  { title: "SUPPORT", links: [{ label: "Help Center", href: "/help" }, { label: "Contact", href: "mailto:support@fl3x.lol" }] },
  { title: "LEGAL", links: [{ label: "Terms of Service", href: "/terms" }, { label: "Privacy Policy", href: "/privacy" }] },
];

export function Footer() {
  return (
    <footer className="relative w-full overflow-hidden">
      <Image src="/images/backgrounds/footer-bg.png" alt="" fill sizes="100vw" className="object-cover object-top" />
      <div className="px-gutter relative flex flex-col gap-12 pt-48 pb-16 md:pt-72 lg:flex-row lg:justify-between">
        <div className="flex flex-col">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={180} height={60} className="mb-4" />
          <p className="mb-6 max-w-md text-lg text-fg-2">
            Create elevated profiles with live widgets. Show off what matters. Flex your way.
          </p>
          <SocialLinks withGithub />
        </div>
        <div className="flex flex-wrap gap-12 md:gap-20 xl:gap-28">
          {columns.map((col) => (
            <div key={col.title} className="flex flex-col">
              <span className="mb-4 font-primary text-3xl">
                <Brand>{col.title}</Brand>
              </span>
              {col.links.map((link) => (
                <Link key={link.label} href={link.href} className="mb-2 text-fg-2 transition-colors hover:text-fg">
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
