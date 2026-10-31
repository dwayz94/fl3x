"use client";

import Link from "next/link";
import { useState } from "react";
import { AlertCircleIcon, Cancel01Icon } from "@hugeicons/core-free-icons";
import type { Banner, PublicConfig } from "@fl3x/shared";
import { Icon } from "@/components/ui";

/**
 * The automatic message, from where the launch is at. Override it from the
 * API env (BANNER_TEXT, BANNER_DETAIL, BANNER_LINK_LABEL, BANNER_LINK_URL),
 * or hide it with BANNER_TEXT=off.
 */
function launchBanner(config: PublicConfig): Banner {
  const symbol = `$${config.token.symbol}`;
  if (config.token.mint) {
    return { text: `${symbol} is live`, detail: `Hold it to unlock Starter and Premium`, link: { label: "See tiers", url: "/#tiers" } };
  }
  if (config.phase === "invite_only") {
    return { text: "FL3X is invite-only for now", detail: `${symbol} launches later: free profiles until then`, link: { label: "Join the waitlist", url: "/join" } };
  }
  return { text: "FL3X is open to everyone", detail: `${symbol} launches soon`, link: { label: "Claim your name", url: "/join" } };
}

/**
 * Pink strip under the landing navbar (Figma 32:6590). Shown on every visit, rendered on the
 * server so it never pushes the hero down after load. Closing it hides it until the next page load.
 */
export function StatusBanner({ config }: { config: PublicConfig }) {
  const banner = config.banner === "off" ? null : (config.banner ?? launchBanner(config));
  const [dismissed, setDismissed] = useState(false);

  if (!banner || dismissed) return null;
  const external = banner.link && /^https?:\/\//.test(banner.link.url);

  return (
    <div className="relative flex items-center justify-center gap-3 bg-brand px-12 py-3 text-black">
      <Icon icon={AlertCircleIcon} size={20} className="hidden shrink-0 sm:block" />
      <p className="flex flex-wrap items-center justify-center gap-x-2 text-center text-xs leading-5">
        <span className="font-medium">{banner.text}</span>
        {banner.detail && (
          <>
            <span className="hidden text-sm sm:inline">∙</span>
            <span>{banner.detail}</span>
          </>
        )}
        {banner.link &&
          (external ? (
            <a href={banner.link.url} target="_blank" rel="noopener noreferrer" className="text-[13px] font-medium text-[#68123d] underline">
              {banner.link.label}
            </a>
          ) : (
            <Link href={banner.link.url} className="text-[13px] font-medium text-[#68123d] underline">
              {banner.link.label}
            </Link>
          ))}
      </p>
      <button
        type="button"
        aria-label="Close"
        onClick={() => setDismissed(true)}
        className="absolute top-1/2 right-3 -translate-y-1/2 rounded-md p-1 transition-colors hover:bg-black/10"
      >
        <Icon icon={Cancel01Icon} size={18} />
      </button>
    </div>
  );
}
