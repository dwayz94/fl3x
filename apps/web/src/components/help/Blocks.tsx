import type { ReactNode } from "react";
import Link from "next/link";
import { Alert02Icon, InformationCircleIcon, Tick01Icon } from "@hugeicons/core-free-icons";
import { BADGES, LINK_KINDS, TIER_LIMITS, TIER_PERKS, WIDGETS, type PublicConfig, type WidgetDef } from "@fl3x/shared";
import { Icon } from "@/components/ui";
import { cn } from "@/lib/cn";
import { fmtCompact } from "@/lib/format";
import type { HelpBlock } from "./content";

const text = "text-base leading-[1.7] text-fg-2";

/** Inline markup: [label](/href) and **bold**. */
export function Inline({ children }: { children: string }) {
  const parts: ReactNode[] = [];
  const re = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(children))) {
    if (m.index > last) parts.push(children.slice(last, m.index));
    if (m[3]) {
      parts.push(
        <strong key={m.index} className="font-normal text-fg">
          {m[3]}
        </strong>,
      );
    } else {
      const [, label, href] = m as unknown as [string, string, string];
      const cls = "text-brand underline-offset-2 hover:underline";
      parts.push(
        href.startsWith("/") ? (
          <Link key={m.index} href={href} className={cls}>
            {label}
          </Link>
        ) : (
          <a key={m.index} href={href} className={cls}>
            {label}
          </a>
        ),
      );
    }
    last = re.lastIndex;
  }
  if (last < children.length) parts.push(children.slice(last));
  return <>{parts}</>;
}

function Table({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/10">
      <table className="w-full border-collapse text-left text-[15px]">
        <thead>
          <tr className="bg-surface">
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 text-xs font-normal text-fg-3 uppercase">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, r) => (
            <tr key={r} className="border-t border-white/10">
              {row.map((cell, i) => (
                <td key={i} className={cn("px-4 py-3 align-top whitespace-nowrap", i === 0 && head[0] === "" ? "text-fg-3" : "text-fg-2")}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const CATEGORY: Record<WidgetDef["category"], string> = { crypto: "Crypto", social: "Social", media: "Media", utility: "Utility" };

export function Block({ block, config }: { block: HelpBlock; config: PublicConfig }) {
  switch (block.type) {
    case "p":
      return (
        <p className={text}>
          <Inline>{block.text}</Inline>
        </p>
      );
    case "list":
      return (
        <ul className="flex flex-col gap-2.5">
          {block.items.map((item) => (
            <li key={item} className={cn("flex gap-3", text)}>
              <span className="mt-[11px] size-1.5 shrink-0 rounded-full bg-brand" />
              <span>
                <Inline>{item}</Inline>
              </span>
            </li>
          ))}
        </ul>
      );
    case "steps":
      return (
        <ol className="flex flex-col gap-3">
          {block.items.map((item, i) => (
            <li key={item} className={cn("flex gap-3", text)}>
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg bg-surface text-xs text-fg tabular-nums">{i + 1}</span>
              <span>
                <Inline>{item}</Inline>
              </span>
            </li>
          ))}
        </ol>
      );
    case "note":
      return (
        <div className={cn("flex gap-3 rounded-2xl px-4 py-3 text-[15px] leading-[1.6]", block.tone === "warn" ? "bg-brand/10 text-fg" : "bg-surface text-fg-2")}>
          <Icon icon={block.tone === "warn" ? Alert02Icon : InformationCircleIcon} size={20} className={cn("mt-0.5 shrink-0", block.tone === "warn" ? "text-brand" : "text-fg-3")} />
          <span>
            <Inline>{block.text}</Inline>
          </span>
        </div>
      );
    case "code":
      return <pre className="overflow-x-auto rounded-2xl bg-surface px-4 py-3 font-mono text-[13px] leading-[1.7] whitespace-pre-wrap text-fg">{block.text}</pre>;
    case "table":
      return <Table head={block.head} rows={block.rows} />;
    case "tiers": {
      const { starter, premium } = config.thresholds;
      const symbol = config.token.symbol;
      const tiers = [
        { name: "Free", hold: "No token needed", perks: TIER_PERKS.none },
        { name: "Starter", hold: `${fmtCompact(starter)} $${symbol}`, perks: TIER_PERKS.starter },
        { name: "Premium", hold: `${fmtCompact(premium)} $${symbol}`, perks: TIER_PERKS.premium },
      ];
      const L = TIER_LIMITS;
      return (
        <div className="flex flex-col gap-4">
          <Table
            head={["", "Free", "Starter", "Premium"]}
            rows={[
              ["Hold", ...tiers.map((t) => t.hold)],
              ["Widgets", L.none.widgets, L.starter.widgets, L.premium.widgets],
              ["Links", L.none.links, L.starter.links, L.premium.links],
              ["Analytics", `${L.none.analyticsDays} days`, `${L.starter.analyticsDays} days`, `${L.premium.analyticsDays} days`],
              ["Invites (pre-launch)", L.none.invites, L.starter.invites, L.premium.invites],
            ]}
          />
          <div className="grid gap-2 md:grid-cols-3">
            {tiers.map((t) => (
              <div key={t.name} className="flex flex-col gap-3 rounded-2xl bg-surface p-4">
                <div>
                  <p className="font-primary text-2xl leading-none">{t.name}</p>
                  <p className="mt-1 text-xs text-fg-3">{t.hold}</p>
                </div>
                <ul className="flex flex-col gap-1.5 text-sm text-fg-2">
                  {t.perks.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Icon icon={Tick01Icon} size={16} className="mt-0.5 shrink-0 text-brand" />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "widgets": {
      const visible = Object.values(WIDGETS as Record<string, WidgetDef>).filter((w) => !w.hidden);
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {visible.map((w) => (
            <li key={w.name} className="flex flex-col gap-1 rounded-2xl bg-surface p-4">
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-fg">{w.name}</span>
                <span className="text-[11px] text-fg-3 uppercase">{CATEGORY[w.category]}</span>
              </span>
              <span className="text-sm leading-[1.5] text-fg-2">{w.description}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "links":
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {LINK_KINDS.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface px-4 py-2.5 text-sm">
              <span className="text-fg">{k.label}</span>
              <span className="truncate font-mono text-xs text-fg-3">{k.prefix ? `${k.prefix}${k.placeholder}` : k.placeholder}</span>
            </li>
          ))}
        </ul>
      );
    case "badges":
      return (
        <ul className="grid gap-2 sm:grid-cols-2">
          {BADGES.map((b) => (
            <li key={b.id} className="flex items-center gap-3 rounded-2xl bg-surface p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/badges/${b.id}.svg`} alt="" width={28} height={28} className="shrink-0" />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm" style={{ color: b.color }}>
                  {b.name}
                </span>
                <span className="text-[13px] leading-[1.4] text-fg-2">{b.description}</span>
              </span>
            </li>
          ))}
        </ul>
      );
  }
}
