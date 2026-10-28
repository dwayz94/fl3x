"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Copy01Icon, Logout01Icon, NewTwitterIcon, RefreshIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import type { Me, Tier } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { Navbar } from "@/components/shared";
import { Brand, Button, buttonClass, Icon } from "@/components/ui";
import { site } from "@/config/site";
import { api } from "@/lib/api";
import { useConfig } from "@/lib/use-config";
import { cn } from "@/lib/cn";

const tierLabel: Record<Tier, string> = { none: "NO TI[e]R", starter: "ST[a]RTeR", premium: "PR[e]M[i]UM" };

export default function DashboardPage() {
  const router = useRouter();
  const { ready, authenticated, logout } = useAuth();
  const { data: me, isLoading } = useMe();

  useEffect(() => {
    if (ready && !authenticated) router.replace("/join");
    else if (me && !me.username) router.replace("/join");
  }, [ready, authenticated, me, router]);

  if (!me?.username || isLoading) {
    return (
      <main className="flex min-h-svh items-center justify-center">
        <span className="size-6 animate-spin rounded-full border-2 border-brand border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="min-h-svh">
      <Navbar />
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-10 md:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-fg-2">Welcome back</p>
            <h1 className="text-5xl md:text-6xl">@{me.username}</h1>
          </div>
          <div className="flex gap-2">
            <Link href={`/@${me.username}`} className={buttonClass({ variant: "secondary", size: "md" })}>
              View profile
            </Link>
            <Button variant="ghost" size="md" onClick={() => void logout().then(() => router.push("/"))} leftIcon={<Icon icon={Logout01Icon} size={18} />}>
              Sign out
            </Button>
          </div>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <TierCard me={me} />
          <InviteCard me={me} />
          <AccountsCard me={me} />
          <Card>
            <h2 className="text-3xl">
              <Brand>WIDG[e]TS</Brand>
            </h2>
            <p className="text-fg-2">The profile editor with live widgets is coming next.</p>
          </Card>
        </div>
      </div>
    </main>
  );
}

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <section className={cn("flex flex-col gap-4 rounded-[30px] bg-surface p-6 md:p-8", className)}>{children}</section>;
}

function TierCard({ me }: { me: Me }) {
  const { getToken } = useAuth();
  const { data: config } = useConfig();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const symbol = config?.token.symbol ?? "FL3X";
  const next = me.tier === "none" ? config?.thresholds.starter : me.tier === "starter" ? config?.thresholds.premium : null;

  const refresh = async () => {
    setRefreshing(true);
    try {
      queryClient.setQueryData(["me"], await api<Me>("/me/refresh-tier", { method: "POST", token: await getToken() }));
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <Card className={me.tier === "premium" ? "bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(255,151,203,0.35)_100%),rgba(255,255,255,0.10)]" : undefined}>
      <div className="flex items-start justify-between">
        <h2 className="text-5xl">
          <Brand>{tierLabel[me.tier]}</Brand>
        </h2>
        <Button variant="ghost" size="sm" onClick={refresh} loading={refreshing} aria-label="Refresh balance">
          <Icon icon={RefreshIcon} size={18} />
        </Button>
      </div>
      <p className="font-primary text-3xl">
        {me.tokenBalance.toLocaleString()} <span className="text-fg-2">${symbol}</span>
      </p>
      {next != null && (
        <p className="text-fg-2">
          Hold {(next - me.tokenBalance).toLocaleString()} more ${symbol} to reach {me.tier === "none" ? "Starter" : "Premium"}.
        </p>
      )}
    </Card>
  );
}

function InviteCard({ me }: { me: Me }) {
  const [copied, setCopied] = useState(false);
  const link = `${site.url}/invite/${me.referralCode}`;
  return (
    <Card>
      <h2 className="text-3xl">
        <Brand>INV[i]Te FRI[e]NDS</Brand>
      </h2>
      <p className="text-fg-2">
        {me.invitesLeft} invite{me.invitesLeft === 1 ? "" : "s"} left · {me.referrals} joined with your code
      </p>
      <button
        onClick={() => {
          void navigator.clipboard.writeText(link);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="flex items-center justify-between gap-2 rounded-2xl border-2 border-line bg-surface-2 px-4 py-3 text-left transition-colors hover:border-brand"
      >
        <span className="truncate">{link.replace(/^https?:\/\//, "")}</span>
        <span className="flex shrink-0 items-center gap-1 text-sm text-fg-2">
          <Icon icon={Copy01Icon} size={16} />
          {copied ? "Copied" : "Copy"}
        </span>
      </button>
    </Card>
  );
}

function AccountsCard({ me }: { me: Me }) {
  const { linkTwitter, linkWallet } = useAuth();
  return (
    <Card className="md:col-span-2">
      <h2 className="text-3xl">
        <Brand>C[o]NN[e]CT[e]D</Brand>
      </h2>
      <div className="flex flex-col gap-3">
        <Row icon={NewTwitterIcon} label={me.xHandle ? `@${me.xHandle}` : "X not linked"}>
          {!me.xHandle && (
            <Button size="sm" variant="secondary" onClick={linkTwitter}>
              Link X
            </Button>
          )}
        </Row>
        {me.wallets.map((w) => (
          <Row key={w} icon={Wallet01Icon} label={`${w.slice(0, 6)}…${w.slice(-6)}`} />
        ))}
        <Row icon={Wallet01Icon} label={me.wallets.length ? "Add another wallet" : "No wallet linked"}>
          <Button size="sm" variant="secondary" onClick={linkWallet}>
            Link wallet
          </Button>
        </Row>
      </div>
    </Card>
  );
}

function Row({ icon, label, children }: { icon: Parameters<typeof Icon>[0]["icon"]; label: string; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3">
      <span className="flex items-center gap-2">
        <Icon icon={icon} size={18} className="text-fg-2" />
        {label}
      </span>
      {children}
    </div>
  );
}
