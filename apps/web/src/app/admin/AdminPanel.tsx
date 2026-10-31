"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BADGES, LAUNCH_PHASES, siteSettingsSchema, type LaunchPhase, type SiteSettings, type Tier } from "@fl3x/shared";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { inputClass } from "@/components/editor/Field";
import { StatusBanner } from "@/components/landing/StatusBanner";
import { Button } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";

/** Kept for this tab only: closing it signs the admin out. */
const KEY = "fl3x:admin-key";
const PHASE_LABEL: Record<LaunchPhase, string> = { invite_only: "Invite only", public: "Open to everyone" };
type BannerMode = "auto" | "custom" | "off";
type Draft = SiteSettings & { bannerMode: BannerMode; bannerText: string; bannerDetail: string; linkLabel: string; linkUrl: string };

const toDraft = (s: SiteSettings): Draft => ({
  ...s,
  bannerMode: s.banner === "off" ? "off" : s.banner ? "custom" : "auto",
  bannerText: s.banner && s.banner !== "off" ? s.banner.text : "",
  bannerDetail: s.banner && s.banner !== "off" ? (s.banner.detail ?? "") : "",
  linkLabel: s.banner && s.banner !== "off" ? (s.banner.link?.label ?? "") : "",
  linkUrl: s.banner && s.banner !== "off" ? (s.banner.link?.url ?? "") : "",
});

const fromDraft = (d: Draft): SiteSettings => ({
  phase: d.phase,
  tokenMint: d.tokenMint?.trim() || null,
  thresholds: d.thresholds,
  banner:
    d.bannerMode === "off"
      ? "off"
      : d.bannerMode === "auto"
        ? null
        : {
            text: d.bannerText.trim(),
            detail: d.bannerDetail.trim() || null,
            link: d.linkLabel.trim() && d.linkUrl.trim() ? { label: d.linkLabel.trim(), url: d.linkUrl.trim() } : null,
          },
});

/**
 * Team settings applied live (no restart): launch phase, token CA, tier
 * thresholds, the landing banner, and genesis invite codes. Needs the API's
 * ADMIN_API_KEY.
 */
export function AdminPanel() {
  const [key, setKey] = useState<string | null>(null);
  const [saved, setSaved] = useState<SiteSettings | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [flash, setFlash] = useState(false);
  const [nudge, setNudge] = useState(0);

  const load = async (k: string) => {
    setError(null);
    try {
      const s = await api<SiteSettings>("/admin/settings", { headers: { "x-admin-key": k } });
      sessionStorage.setItem(KEY, k);
      setKey(k);
      setSaved(s);
      setDraft(toDraft(s));
    } catch (err) {
      sessionStorage.removeItem(KEY);
      setKey(null);
      setError(err instanceof ApiRequestError && err.status === 403 ? "Wrong admin key" : "Can't reach the API");
    }
  };

  useEffect(() => {
    const k = sessionStorage.getItem(KEY);
    if (k) void load(k);
  }, []);

  if (!key || !draft || !saved) return <Unlock onUnlock={load} error={error} />;

  const next = fromDraft(draft);
  const check = siteSettingsSchema.safeParse(next);
  const dirty = JSON.stringify(next) !== JSON.stringify(saved);
  const set = (patch: Partial<Draft>) => setDraft({ ...draft, ...patch });

  const save = async () => {
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? "Invalid settings");
      return setNudge((n) => n + 1);
    }
    setSaving(true);
    setError(null);
    try {
      const s = await api<SiteSettings>("/admin/settings", { method: "PUT", headers: { "x-admin-key": key }, json: check.data });
      setSaved(s);
      setDraft(toDraft(s));
      setFlash(true);
      setTimeout(() => setFlash(false), 1800);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-4 px-4 py-8 pb-32">
      <header className="mb-4 flex items-center justify-between">
        <Link href="/" aria-label="FL3X home">
          <Image src="/images/fl3x-logo.svg" alt="FL3X" width={88} height={31} />
        </Link>
        <button
          type="button"
          onClick={() => {
            sessionStorage.removeItem(KEY);
            setKey(null);
          }}
          className="text-sm text-fg-3 hover:text-fg"
        >
          Lock
        </button>
      </header>
      <div className="mb-2">
        <h1 className="text-4xl leading-none">ADMIN</h1>
        <p className="mt-2 text-sm text-fg-2">Changes apply live, no restart. The landing picks them up within a minute.</p>
      </div>

      <Card title="Launch" desc="Invite only: an invite code is required to claim a name. Open: anyone can sign up.">
        <Segmented value={draft.phase} options={LAUNCH_PHASES.map((p) => ({ id: p, label: PHASE_LABEL[p] }))} onChange={(phase) => set({ phase })} />
      </Card>

      <Card title="Token" desc="The $FL3X contract address (Solana mint). Empty until launch: everyone stays Free. Holdings are re-checked within 5 minutes.">
        <input
          className={cn(inputClass, "font-mono text-sm")}
          placeholder="Token mint address"
          value={draft.tokenMint ?? ""}
          spellCheck={false}
          onChange={(e) => set({ tokenMint: e.target.value })}
        />
      </Card>

      <Card title="Tier thresholds" desc="Tokens to hold, across a member's Solana wallets.">
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField label="Starter" value={draft.thresholds.starter} onChange={(starter) => set({ thresholds: { ...draft.thresholds, starter } })} />
          <NumberField label="Premium" value={draft.thresholds.premium} onChange={(premium) => set({ thresholds: { ...draft.thresholds, premium } })} />
        </div>
      </Card>

      <Card title="Landing banner" desc="The pink strip under the navbar. Automatic follows the launch phase and the token.">
        <Segmented
          value={draft.bannerMode}
          options={[
            { id: "auto", label: "Automatic" },
            { id: "custom", label: "Custom" },
            { id: "off", label: "Hidden" },
          ]}
          onChange={(bannerMode) => set({ bannerMode })}
        />
        {draft.bannerMode === "custom" && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <TextField label="Message" value={draft.bannerText} max={120} onChange={(bannerText) => set({ bannerText })} className="sm:col-span-2" />
            <TextField label="Detail (optional)" value={draft.bannerDetail} max={160} onChange={(bannerDetail) => set({ bannerDetail })} className="sm:col-span-2" />
            <TextField label="Link label (optional)" value={draft.linkLabel} max={40} onChange={(linkLabel) => set({ linkLabel })} />
            <TextField label="Link URL" value={draft.linkUrl} placeholder="https://… or /join" onChange={(linkUrl) => set({ linkUrl })} />
          </div>
        )}
        <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
          {next.banner === "off" ? (
            <p className="px-4 py-3 text-center text-xs text-fg-3">No banner on the landing.</p>
          ) : (
            <StatusBanner preview config={{ phase: next.phase, token: { symbol: "FL3X", mint: next.tokenMint }, thresholds: next.thresholds, banner: next.banner }} />
          )}
        </div>
      </Card>

      <Members adminKey={key} />

      <Invites adminKey={key} />

      <UnsavedBar dirty={dirty} saving={saving} savedFlash={flash} error={error} nudge={nudge} onDiscard={() => setDraft(toDraft(saved))} onSave={() => void save()} />
    </main>
  );
}

function Unlock({ onUnlock, error }: { onUnlock: (key: string) => void; error: string | null }) {
  const [value, setValue] = useState("");
  return (
    <main className="flex min-h-svh items-center justify-center px-4">
      <form
        className="flex w-full max-w-[360px] flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onUnlock(value.trim());
        }}
      >
        <h1 className="text-center text-4xl leading-none">ADMIN</h1>
        <p className="mb-2 text-center text-sm text-fg-2">Enter your admin key.</p>
        <input type="password" className={inputClass} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Admin key" autoFocus autoComplete="off" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full">
          Unlock
        </Button>
      </form>
    </main>
  );
}

type Member = {
  id: string;
  username: string | null;
  xHandle: string | null;
  tier: Tier;
  tierOverride: "starter" | "premium" | null;
  founder: boolean;
  badges: string[];
  profile: { displayName: string | null; avatarUrl: string | null } | null;
};
const TEAM_BADGES = BADGES.filter((b) => b.unlock.kind === "granted");

/** Find a member, then make them Founder, gift a tier or hand out team badges. Each change saves at once. */
function Members({ adminKey }: { adminKey: string }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Member[] | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = { "x-admin-key": adminKey };

  const search = async () => {
    if (q.trim().length < 2) return;
    setError(null);
    try {
      const found = await api<Member[]>(`/admin/users/lookup?q=${encodeURIComponent(q.trim())}`, { headers });
      setResults(found);
      setMember(found.length === 1 ? found[0]! : null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Search failed");
    }
  };
  const update = async (patch: Partial<Pick<Member, "founder" | "tierOverride" | "badges">>) => {
    if (!member) return;
    setBusy(true);
    setError(null);
    try {
      const next = await api<Member>(`/admin/users/${member.id}`, { method: "PATCH", headers, json: patch });
      setMember(next);
      setResults((r) => r?.map((m) => (m.id === next.id ? next : m)) ?? null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Members" desc="Search by username, X handle, wallet or internal ID. Changes save at once and show on the profile right away.">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void search();
        }}
      >
        <input className={inputClass} placeholder="@username, X handle, wallet…" value={q} onChange={(e) => setQ(e.target.value)} spellCheck={false} />
        <Button type="submit" size="md" className="shrink-0">
          Search
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {results && results.length === 0 && <p className="mt-3 text-sm text-fg-3">Nobody found.</p>}
      {results && results.length > 1 && (
        <ul className="mt-3 flex flex-col gap-1">
          {results.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => setMember(m)} className={cn("w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-white/[0.06]", member?.id === m.id && "bg-white/[0.06]")}>
                {m.profile?.displayName || m.username || m.xHandle} <span className="text-fg-3">@{m.username ?? "no username"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {member && (
        <div className={cn("mt-4 flex flex-col gap-5 rounded-2xl bg-white/[0.03] p-4", busy && "opacity-60")}>
          <div className="flex items-center gap-3">
            <span className="size-11 shrink-0 overflow-hidden rounded-full bg-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {member.profile?.avatarUrl && <img src={member.profile.avatarUrl} alt="" className="size-full object-cover" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-primary text-xl leading-none uppercase">{member.profile?.displayName || member.username || "No profile yet"}</p>
              <p className="mt-1 text-xs text-fg-3">
                {member.username ? `@${member.username}` : "No username"}
                {member.xHandle && ` · X @${member.xHandle}`} · tier <span className="text-fg-2">{member.tier}</span>
              </p>
            </div>
            {member.username && (
              <Link href={`/@${member.username}`} target="_blank" className="shrink-0 text-xs text-brand hover:underline">
                Profile ↗
              </Link>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs text-fg-2">Tier</p>
            <Segmented
              value={member.tierOverride ?? "holdings"}
              options={[
                { id: "holdings", label: "From holdings" },
                { id: "starter", label: "Gift Starter" },
                { id: "premium", label: "Gift Premium" },
              ]}
              onChange={(v) => void update({ tierOverride: v === "holdings" ? null : (v as "starter" | "premium") })}
            />
            <p className="mt-1.5 text-[11px] text-fg-3">A gifted tier is a minimum: holding more $FL3X still counts.</p>
          </div>

          <div>
            <p className="mb-2 text-xs text-fg-2">Badges</p>
            <div className="flex flex-wrap gap-2">
              <BadgeToggle id="founder" name="Founder (team · all Premium)" on={member.founder} onClick={() => void update({ founder: !member.founder })} />
              {TEAM_BADGES.map((b) => {
                const on = member.badges.includes(b.id);
                return (
                  <BadgeToggle
                    key={b.id}
                    id={b.id}
                    name={b.name}
                    on={on}
                    onClick={() => void update({ badges: on ? member.badges.filter((x) => x !== b.id) : [...member.badges, b.id] })}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function BadgeToggle({ id, name, on, onClick }: { id: string; name: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={cn("flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm transition-colors", on ? "border-brand/60 bg-brand/10 text-fg" : "border-white/10 text-fg-3 hover:text-fg")}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`/images/badges/${id}.svg`} alt="" className={cn("size-4", !on && "opacity-40 grayscale")} />
      {name}
    </button>
  );
}

/** Genesis invite codes (no owner): for the team to hand out. */
function Invites({ adminKey }: { adminKey: string }) {
  const [count, setCount] = useState(5);
  const [maxUses, setMaxUses] = useState(1);
  const [note, setNote] = useState("");
  const [codes, setCodes] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ codes: string[] }>("/admin/invites", { headers: { "x-admin-key": adminKey }, json: { count, maxUses, note: note.trim() || undefined } });
      setCodes(res.codes);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not create codes");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Invite codes" desc="Team codes to hand out (they don't belong to a member).">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,2fr)_auto] sm:items-end">
        <NumberField label="How many" value={count} onChange={(v) => setCount(Math.min(500, Math.max(1, v)))} />
        <NumberField label="Uses each" value={maxUses} onChange={(v) => setMaxUses(Math.max(1, v))} />
        <TextField label="Note (optional)" value={note} max={200} placeholder="Who they're for" onChange={setNote} />
        <Button onClick={() => void create()} loading={busy} size="md">
          Create
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {codes.length > 0 && (
        <div className="mt-4 rounded-xl bg-white/[0.04] p-3">
          <div className="grid grid-cols-2 gap-1 font-mono text-sm sm:grid-cols-4">
            {codes.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
          <button
            type="button"
            className="mt-3 text-xs text-brand hover:underline"
            onClick={() => {
              void navigator.clipboard.writeText(codes.join("\n"));
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy all"}
          </button>
        </div>
      )}
    </Card>
  );
}

function Card({ title, desc, children }: { title: string; desc: string; children: ReactNode }) {
  return (
    <section className="rounded-3xl bg-[#0d0d0d] p-5">
      <h2 className="font-primary text-2xl leading-none">{title}</h2>
      <p className="mt-1 mb-4 text-xs text-fg-3">{desc}</p>
      {children}
    </section>
  );
}

function Segmented<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex rounded-xl bg-white/[0.05] p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn("rounded-lg px-3 py-1.5 text-sm transition-colors", value === o.id ? "bg-brand text-bg" : "text-fg-2 hover:text-fg")}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs text-fg-2">{label}</span>
      <input type="number" min={0} className={inputClass} value={value} onChange={(e) => onChange(Math.max(0, Math.floor(Number(e.target.value) || 0)))} />
    </label>
  );
}

function TextField(props: { label: string; value: string; max?: number; placeholder?: string; className?: string; onChange: (v: string) => void }) {
  return (
    <label className={cn("block", props.className)}>
      <span className="mb-1.5 block text-xs text-fg-2">{props.label}</span>
      <input className={inputClass} value={props.value} maxLength={props.max} placeholder={props.placeholder} onChange={(e) => props.onChange(e.target.value)} />
    </label>
  );
}
