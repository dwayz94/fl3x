import Link from "next/link";
import { Tick01Icon } from "@hugeicons/core-free-icons";
import { TIER_PERKS, type PublicConfig } from "@fl3x/shared";
import { Brand, buttonClass, Icon } from "@/components/ui";
import { cn } from "@/lib/cn";

// One source of truth with the Premium page (TIER_PERKS in shared): only real features.
const starterPerks = TIER_PERKS.starter;
const premiumPerks = TIER_PERKS.premium;

export const premiumBackground =
  "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(255, 151, 203, 0.35) 100%), rgba(255, 255, 255, 0.10)";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { notation: "compact" }).format(n);

export function HolderTiers({ config }: { config: PublicConfig }) {
  const { symbol } = config.token;
  return (
    <section id="tiers" className="px-gutter py-24 md:py-40">
      <div className="mb-12 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="mb-4 text-5xl md:text-6xl">
            <Brand>FREE. THEN FL[3]X.</Brand>
          </h2>
          <p className="max-w-xl text-lg text-fg-2">
            Everyone gets a profile, no token needed. Holding ${symbol} in a linked wallet unlocks more: no subscription, it updates on its own.
          </p>
        </div>
        <span className="w-fit rounded-full bg-success/15 px-4 py-2 text-sm text-success">No token needed to start</span>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <TierCard
          title="FR[e]e"
          amount="No token"
          free
          tagline="Your profile, today"
          perks={TIER_PERKS.none}
          cta="Create my profile"
          primary
          className="bg-surface"
        />
        <TierCard
          title="ST[a]RTeR"
          amount={`${fmt(config.thresholds.starter)} $${symbol}`}
          tagline="More widgets and links"
          perks={starterPerks}
          cta="Start Building"
          className="bg-surface"
        />
        <TierCard
          title="PR[e]M[i]UM"
          amount={`${fmt(config.thresholds.premium)} $${symbol}`}
          tagline="The full FL3X, checkmark included"
          perks={premiumPerks}
          cta="Go Premium"
          primary
          style={{ background: premiumBackground }}
        />
      </div>
    </section>
  );
}

function TierCard(props: {
  title: string;
  amount: string;
  tagline: string;
  perks: string[];
  cta: string;
  /** Free tier: no "HOLD" label. */
  free?: boolean;
  primary?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("flex w-full flex-col justify-between gap-8 rounded-[30px] p-8 md:p-[38px]", props.className)} style={props.style}>
      <div className="flex flex-col items-start gap-4">
        <h3 className="text-[56px] leading-none md:text-[64px]">
          <Brand>{props.title}</Brand>
        </h3>
        <div className="flex items-baseline gap-2 font-primary">
          {!props.free && <span className="text-fg-2 text-2xl">HOLD</span>}
          <span className="text-[40px] leading-none">{props.amount}</span>
        </div>
        <p className="text-fg-2">{props.tagline}</p>
        <ul className="flex flex-col gap-2">
          {props.perks.map((p) => (
            <li key={p} className="flex items-center gap-2">
              <Icon icon={Tick01Icon} size={18} className="shrink-0 text-brand" />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <Link href="/join" className={buttonClass({ variant: props.primary ? "primary" : "secondary", className: "w-full" })}>
        {props.cta}
      </Link>
    </div>
  );
}
