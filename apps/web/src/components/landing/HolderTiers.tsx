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
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="flex flex-col justify-between gap-10">
          <div>
            <h2 className="mb-4 text-5xl md:text-6xl">
              <Brand>HOLD. FL[3]X.</Brand>
            </h2>
            <p className="max-w-md text-lg text-fg-2">
              Your profile is free. Holding ${symbol} in your verified wallets unlocks more widgets and customization. No
              subscriptions, updates automatically.
            </p>
          </div>
          <TierCard
            title="ST[a]RTeR"
            amount={`${fmt(config.thresholds.starter)} $${symbol}`}
            tagline="Everything you need to begin"
            perks={starterPerks}
            cta="Start Building"
            className="bg-surface"
          />
        </div>
        <TierCard
          title="PR[e]M[i]UM"
          amount={`${fmt(config.thresholds.premium)} $${symbol}`}
          tagline="The full FL3X, checkmark included"
          perks={premiumPerks}
          cta="Go Premium"
          primary
          className="lg:min-h-[743px]"
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
  primary?: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("flex w-full flex-col justify-between gap-8 rounded-[30px] p-8 md:p-[38px] lg:w-[426px]", props.className)} style={props.style}>
      <div className="flex flex-col items-start gap-4">
        <h3 className="text-[56px] leading-none md:text-[64px]">
          <Brand>{props.title}</Brand>
        </h3>
        <div className="flex items-baseline gap-2 font-primary">
          <span className="text-fg-2 text-2xl">HOLD</span>
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
