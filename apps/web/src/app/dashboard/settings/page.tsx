"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight01Icon, Crown02Icon, Link04Icon, Logout01Icon, NewTwitterIcon, Plug01Icon, UserAdd01Icon, UserCircleIcon, Wallet01Icon,
} from "@hugeicons/core-free-icons";
import type { EditableProfile, Me } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { PageHeader, Spinner } from "@/components/dashboard/Panel";
import { ConnectionsPanel } from "@/components/dashboard/ConnectionsPanel";
import { CopyField } from "@/components/dashboard/CopyField";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { WalletsPanel } from "@/components/dashboard/WalletsPanel";
import { inputClass } from "@/components/editor/Field";
import { Button, Icon, ImageInput, Verified } from "@/components/ui";
import { site } from "@/config/site";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { fmtNumber, referralLink } from "@/lib/format";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserCircleIcon },
  { id: "account", label: "Account", icon: NewTwitterIcon },
  { id: "wallets", label: "Wallets", icon: Wallet01Icon },
  { id: "connections", label: "Connections", icon: Plug01Icon },
  { id: "session", label: "Session", icon: Logout01Icon },
] as const;

const TIER_LABEL = { none: "Free", starter: "Starter", premium: "Premium" } as const;

export default function SettingsPage() {
  const { data: me } = useMe();
  const [active, setActive] = useState<string>("profile");

  // Highlight the section in view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const top = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    for (const s of SECTIONS) {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [me]);

  if (!me) return <Spinner />;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 pb-32 md:px-10">
      <PageHeader title="S[e]TT[i]NGS" subtitle="Your profile, linked accounts and session." />
      <div className="grid gap-8 md:grid-cols-[180px_minmax(0,1fr)]">
        <nav className="hidden md:block">
          <ul className="sticky top-8 flex flex-col gap-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className={cn(
                    "flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
                    active === s.id ? "bg-white/10 text-fg" : "text-fg-3 hover:bg-white/5 hover:text-fg",
                  )}
                >
                  <Icon icon={s.icon} size={16} className={active === s.id ? "text-brand" : undefined} />
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-10">
          <Section id="profile" title="Profile" desc="What visitors see on your card. You can also edit it right on the card in Customize.">
            <IdentityForm me={me} />
          </Section>

          <Section id="account" title="Account" desc="Your sign-in, your plan and your invites.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Tile
                icon={NewTwitterIcon}
                label="X account"
                value={me.xHandle ? `@${me.xHandle}` : "Not linked"}
                action={!me.xHandle && <LinkX />}
                hint="Used to sign in and to join the waitlist."
              />
              <Tile
                icon={Crown02Icon}
                label="Plan"
                value={
                  <span className="flex items-center gap-1.5">
                    {TIER_LABEL[me.tier]}
                    {me.tier === "premium" && <Verified size={16} />}
                  </span>
                }
                hint={`${fmtNumber(me.tokenBalance)} tokens held across your wallets.`}
                action={
                  <Link href="/dashboard/premium" className="text-xs text-brand hover:underline">
                    {me.tier === "premium" ? "Perks" : "Upgrade"}
                  </Link>
                }
              />
              <Tile
                icon={UserAdd01Icon}
                label="Referrals"
                value={`${me.referrals} joined`}
                hint={referralLink(me.username ?? "").replace(/^https?:\/\//, "")}
                action={
                  <Link href="/dashboard/referral" className="flex items-center gap-0.5 text-xs text-brand hover:underline">
                    Open <Icon icon={ArrowRight01Icon} size={12} />
                  </Link>
                }
              />
              <Tile icon={Link04Icon} label="Profile link" value={`${site.domain}/@${me.username}`} hint="Your username is permanent for now." />
            </div>
          </Section>

          <Section id="wallets" title="Wallets" desc="Each wallet is proven with a free signature. Wallet widgets add them all up; Solana wallets also count toward your tier.">
            <WalletsPanel me={me} />
          </Section>

          <Section id="connections" title="Connections" desc="Accounts that keep widgets up to date on their own.">
            <Suspense>
              <ConnectionsPanel />
            </Suspense>
            <p className="mt-3 text-[11px] text-fg-3">YouTube and Twitch need no connection: put your channel in the Video widget and it follows your lives and uploads.</p>
          </Section>

          <Section id="session" title="Session" desc="Signed in on this device.">
            <SignOut />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ id, title, desc, children }: { id: string; title: string; desc: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <div className="mb-4">
        <h2 className="font-primary text-2xl leading-none">{title}</h2>
        <p className="mt-1 text-xs text-fg-3">{desc}</p>
      </div>
      <div className="rounded-3xl border border-white/10 bg-[#0d0d0d] p-5">{children}</div>
    </section>
  );
}

function Tile({ icon, label, value, hint, action }: { icon: typeof Wallet01Icon; label: string; value: ReactNode; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-white/[0.03] p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white/5">
        <Icon icon={icon} size={18} className="text-fg-2" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] text-fg-3">{label}</p>
          {action}
        </div>
        <div className="mt-0.5 truncate text-[15px] leading-tight text-fg">{value}</div>
        {hint && <p className="mt-0.5 truncate text-[11px] text-fg-3">{hint}</p>}
      </div>
    </div>
  );
}

function LinkX() {
  const { linkTwitter } = useAuth();
  return (
    <button type="button" onClick={linkTwitter} className="text-xs text-brand hover:underline">
      Link
    </button>
  );
}

function SignOut() {
  const router = useRouter();
  const { logout } = useAuth();
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-fg-2">Log out of FL3X on this browser. Your profile stays online.</p>
      <Button
        size="md"
        variant="secondary"
        loading={busy}
        onClick={() => {
          setBusy(true);
          void logout().then(() => router.push("/"));
        }}
        leftIcon={<Icon icon={Logout01Icon} size={16} />}
      >
        Log out
      </Button>
    </div>
  );
}

/** Avatar, display name and bio. The avatar saves on upload; text changes go through the unsaved bar. */
function IdentityForm({ me }: { me: Me }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data } = useEditorProfile();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setName(data?.profile.displayName ?? "");
    setBio(data?.profile.bio ?? "");
    setError(null);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [data]);
  if (!data) return <Spinner />;

  const patch = async (body: { displayName?: string | null; bio?: string | null; avatarUrl?: string | null }) => {
    setError(null);
    setSaving(true);
    try {
      const profile = await api<EditableProfile>("/me/identity", { method: "PATCH", token: await getToken(), json: body });
      qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile } : old));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };
  const dirty = name !== (data.profile.displayName ?? "") || bio !== (data.profile.bio ?? "");

  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:gap-6">
      <div className="flex flex-col items-center gap-2">
        <ImageInput kind="avatar" round value={data.profile.avatarUrl ?? undefined} onChange={(url) => void patch({ avatarUrl: url })} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4">
        <Field label="Display name" count={`${name.length}/32`}>
          <input className={inputClass} maxLength={32} value={name} onChange={(e) => setName(e.target.value)} placeholder={me.username ?? ""} />
        </Field>
        <Field label="Bio" count={`${bio.length}/160`}>
          <textarea className={`${inputClass} h-24 resize-none py-2.5`} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="FL3X on all screens!" />
        </Field>
        <Field label="Profile link">
          <CopyField value={`${site.url}/@${me.username}`} display={`${site.domain}/@${me.username}`} />
        </Field>
      </div>
      <UnsavedBar dirty={dirty} saving={saving} savedFlash={savedFlash} error={error} nudge={0} onDiscard={reset} onSave={() => void patch({ displayName: name, bio })} />
    </div>
  );
}

function Field({ label, count, children }: { label: string; count?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex justify-between text-xs text-fg-2">
        {label}
        {count && <span className="text-fg-3">{count}</span>}
      </span>
      {children}
    </label>
  );
}
