"use client";

import Image from "next/image";
import { Copy01Icon, Delete02Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { BADGES, LAUNCH_PHASES, siteSettingsSchema, type LaunchPhase, type SiteSettings, type Tier } from "@fl3x/shared";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { inputClass } from "@/components/editor/Field";
import { StatusBanner } from "@/components/landing/StatusBanner";
import { Button, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { shortAddress } from "@/lib/format";
import { teamSession } from "@/lib/team-session";

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
      // Without the right key the API answers 404, as if /admin didn't exist.
      setError(err instanceof ApiRequestError && (err.status === 404 || err.status === 403) ? "Wrong admin key" : "Can't reach the API");
    }
  };

  useEffect(() => {
    teamSession.rememberAdminPath(window.location.pathname);
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
            <StatusBanner config={{ phase: next.phase, token: { symbol: "FL3X", mint: next.tokenMint }, thresholds: next.thresholds, banner: next.banner }} />
          )}
        </div>
      </Card>

      <Members adminKey={key} />

      <ReservedProfiles adminKey={key} />

      <WalletGrants adminKey={key} />

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
  linkedWallets: { id: string; chain: "solana" | "evm"; address: string; signed: boolean }[];
  /** Made ahead by the team, waiting for this X handle to sign in. */
  reservedFor: string | null;
  previewCode: string | null;
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

          {(member.founder || member.reservedFor) && (
            <TeamWallets
              member={member}
              adminKey={adminKey}
              onChange={(next) => {
                setMember(next);
                setResults((r) => r?.map((m) => (m.id === next.id ? next : m)) ?? null);
              }}
            />
          )}
        </div>
      )}
    </Card>
  );
}

/**
 * Founders and reserved profiles only: any address, no signature, for their
 * wallet widgets. Never counts for a tier; a real signature takes it over.
 */
function TeamWallets({ member, adminKey, onChange }: { member: Member; adminKey: string; onChange: (m: Member) => void }) {
  const [address, setAddress] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = { "x-admin-key": adminKey };
  const unsigned = member.linkedWallets.filter((w) => !w.signed);

  const run = async (call: () => Promise<Member>) => {
    setBusy(true);
    setError(null);
    try {
      onChange(await call());
      setAddress("");
      setLabel("");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-2 text-xs text-fg-2">Wallets without signature</p>
      {unsigned.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1">
          {unsigned.map((w) => (
            <li key={w.id} className="flex items-center gap-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] leading-none text-fg-2 uppercase">{w.chain}</span>
              <span className="flex-1 truncate font-mono" title={w.address}>
                {shortAddress(w.address)}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void run(() => api<Member>(`/admin/users/${member.id}/wallets/${w.id}`, { method: "DELETE", headers }))}
                aria-label="Remove wallet"
                className="flex size-8 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-danger/10 hover:text-danger"
              >
                <Icon icon={Delete02Icon} size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (address.trim()) void run(() => api<Member>(`/admin/users/${member.id}/wallets`, { method: "POST", headers, json: { address: address.trim(), label: label.trim() || undefined } }));
        }}
      >
        <input className={cn(inputClass, "font-mono")} placeholder="Solana or EVM address" value={address} onChange={(e) => setAddress(e.target.value)} spellCheck={false} />
        <input className={cn(inputClass, "sm:w-40")} placeholder="Label (optional)" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} />
        <Button type="submit" size="md" className="shrink-0" disabled={busy || !address.trim()}>
          Add
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      <p className="mt-1.5 text-[11px] text-fg-3">Shows in their wallet widgets like a linked wallet. Never counts for a tier. If the real owner signs for it, it moves to them.</p>
    </div>
  );
}

/**
 * Profiles built ahead for known people: the handle is held, the profile is
 * hidden (except the private preview link), and it becomes theirs the first
 * time they sign in with that X account.
 */
function ReservedProfiles({ adminKey }: { adminKey: string }) {
  const [list, setList] = useState<Member[] | null>(null);
  const [username, setUsername] = useState("");
  const [xHandle, setXHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = { "x-admin-key": adminKey };

  const reload = () =>
    api<Member[]>("/admin/reserved", { headers })
      .then(setList)
      .catch(() => setError("Could not load reserved profiles"));
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      await api<Member>("/admin/reserved", {
        method: "POST",
        headers,
        json: { username: username.trim(), xHandle: (xHandle.trim() || username.trim()).replace(/^@/, ""), displayName: displayName.trim() || undefined, tier: "premium" },
      });
      setUsername("");
      setXHandle("");
      setDisplayName("");
      await reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not reserve");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card
      title="Reserved profiles"
      desc="Hold a handle for someone known and build their profile ahead (Premium). It's public at its link (out of search and Explore) with a “Claim” tag. The first time they sign in with that X account, it's theirs."
    >
      <form
        className="grid gap-2 sm:grid-cols-[1fr_1fr_1fr_auto]"
        onSubmit={(e) => {
          e.preventDefault();
          if (username.trim()) void create();
        }}
      >
        <input className={inputClass} placeholder="FL3X username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))} spellCheck={false} />
        <input className={inputClass} placeholder="X handle (same if empty)" value={xHandle} onChange={(e) => setXHandle(e.target.value.replace(/\s/g, ""))} spellCheck={false} />
        <input className={inputClass} placeholder="Display name" value={displayName} maxLength={40} onChange={(e) => setDisplayName(e.target.value)} />
        <Button type="submit" size="md" disabled={busy || !username.trim()}>
          Reserve
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {list && list.length === 0 && <p className="mt-3 text-sm text-fg-3">No reserved profile yet.</p>}
      {list && list.length > 0 && (
        <ul className="mt-4 flex flex-col gap-2">
          {list.map((m) => (
            <ReservedRow key={m.id} member={m} adminKey={adminKey} onChange={(next) => setList((l) => l?.map((x) => (x.id === next.id ? next : x)) ?? null)} onRemoved={() => void reload()} />
          ))}
        </ul>
      )}
    </Card>
  );
}

function ReservedRow({ member: m, adminKey, onChange, onRemoved }: { member: Member; adminKey: string; onChange: (m: Member) => void; onRemoved: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = { "x-admin-key": adminKey };
  const profileUrl = `${window.location.origin}/@${m.username}`;

  const build = async () => {
    setError(null);
    try {
      const s = await api<{ token: string; username: string }>(`/admin/reserved/${m.id}/session`, { method: "POST", headers });
      teamSession.set(s);
      window.location.href = "/dashboard/customize";
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not open it");
    }
  };
  const remove = async () => {
    try {
      await api(`/admin/reserved/${m.id}`, { method: "DELETE", headers });
      onRemoved();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not delete");
      setConfirming(false);
    }
  };

  return (
    <li className="flex flex-col gap-3 rounded-2xl bg-white/[0.03] p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="size-10 shrink-0 overflow-hidden rounded-full bg-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {m.profile?.avatarUrl && <img src={m.profile.avatarUrl} alt="" className="size-full object-cover" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-primary text-lg leading-none uppercase">{m.profile?.displayName || m.username}</p>
          <p className="mt-1 text-xs text-fg-3">
            @{m.username} · for X @{m.xHandle} · {m.tier}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={() => void build()}>
            Build profile
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void navigator.clipboard.writeText(profileUrl);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
          >
            {copied ? "Copied" : "Copy link"}
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setOpen((o) => !o)}>
            Wallets
          </Button>
          {confirming ? (
            <>
              <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1.5 text-xs text-fg-3 hover:text-fg">
                Keep
              </button>
              <button type="button" onClick={() => void remove()} className="rounded-lg bg-danger/15 px-2.5 py-1.5 text-xs text-danger hover:bg-danger/25">
                Delete
              </button>
            </>
          ) : (
            <button
              type="button"
              aria-label="Delete reserved profile"
              onClick={() => setConfirming(true)}
              className="flex size-8 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Icon icon={Delete02Icon} size={16} />
            </button>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {open && <TeamWallets member={m} adminKey={adminKey} onChange={onChange} />}
    </li>
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

type Grant = {
  address: string;
  tier: "starter" | "premium";
  note: string | null;
  createdAt: string;
  member: { id: string; username: string | null; tier: Tier } | null;
};
type GrantResult = { added: number; existing: number; invalid: number; invalidSamples: string[] };
const TIER_LABEL = { starter: "Starter", premium: "Premium" } as const;

/**
 * Giveaways: paste Solana addresses that get a tier, joined or not. A member
 * whose wallets include one gets at least that tier (applied at once to those
 * who already have it, and as soon as someone links it).
 */
function WalletGrants({ adminKey }: { adminKey: string }) {
  const [text, setText] = useState("");
  const [tier, setTier] = useState<Grant["tier"]>("premium");
  const [note, setNote] = useState("");
  const [grants, setGrants] = useState<Grant[] | null>(null);
  const [result, setResult] = useState<GrantResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const headers = { "x-admin-key": adminKey };

  const refresh = async () => {
    try {
      setGrants(await api<Grant[]>("/admin/wallet-grants", { headers }));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not load grants");
    }
  };
  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminKey]);

  const add = async () => {
    if (!text.trim()) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api<GrantResult>("/admin/wallet-grants", { headers, json: { addresses: text, tier, note: note.trim() || undefined } });
      setResult(res);
      // Only what couldn't be read stays in the box, to fix and add again.
      setText(res.invalidSamples.join("\n"));
      await refresh();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not add these wallets");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Wallet grants" desc="Giveaways: paste Solana addresses (one per line, or separated by commas or spaces). Whoever holds one gets at least this tier, now or as soon as they join and link it.">
      <textarea
        className={cn(inputClass, "h-28 resize-y py-2 font-mono text-sm")}
        placeholder="Solana addresses…"
        value={text}
        spellCheck={false}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="mt-3 grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-end">
        <div>
          <span className="mb-1.5 block text-xs text-fg-2">Tier</span>
          <Segmented
            value={tier}
            options={[
              { id: "premium", label: "Premium" },
              { id: "starter", label: "Starter" },
            ]}
            onChange={setTier}
          />
        </div>
        <TextField label="Note (optional)" value={note} max={200} placeholder="Giveaway #1" onChange={setNote} />
        <Button onClick={() => void add()} loading={busy} disabled={!text.trim()} size="md">
          Add
        </Button>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
      {result && (
        <div className="mt-3 rounded-xl bg-white/[0.04] p-3 text-sm">
          <p>
            <span className="text-success">{result.added} added</span>
            <span className="text-fg-3"> · {result.existing} already there</span>
            <span className={result.invalid ? "text-danger" : "text-fg-3"}> · {result.invalid} invalid</span>
          </p>
          {result.invalidSamples.length > 0 && (
            <p className="mt-1 font-mono text-[11px] break-all text-fg-3">
              Not Solana addresses (left in the box): {result.invalidSamples.join(", ")}
              {result.invalid > result.invalidSamples.length && "…"}
            </p>
          )}
        </div>
      )}

      <div className="mt-5">
        <p className="mb-2 text-xs text-fg-2">{grants ? `${grants.length} granted wallet${grants.length === 1 ? "" : "s"}` : "Loading…"}</p>
        {grants && grants.length > 0 && (
          <ul className="flex flex-col gap-1">
            {grants.map((g) => (
              <GrantRow key={g.address} grant={g} adminKey={adminKey} onRemoved={() => setGrants((list) => list?.filter((x) => x.address !== g.address) ?? null)} />
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function GrantRow({ grant: g, adminKey, onRemoved }: { grant: Grant; adminKey: string; onRemoved: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await api(`/admin/wallet-grants/${encodeURIComponent(g.address)}`, { method: "DELETE", headers: { "x-admin-key": adminKey } });
      onRemoved();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not remove");
      setRemoving(false);
      setConfirming(false);
    }
  };

  return (
    <li className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
      <button
        type="button"
        title={g.address}
        onClick={() => {
          void navigator.clipboard.writeText(g.address);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="group flex items-center gap-1.5 font-mono text-fg"
      >
        {shortAddress(g.address)}
        <Icon icon={copied ? Tick02Icon : Copy01Icon} size={14} className={copied ? "text-success" : "text-fg-3 group-hover:text-fg"} />
      </button>
      <span className="rounded-md bg-white/[0.06] px-2 py-1 text-[10px] leading-none text-fg-2">{TIER_LABEL[g.tier]}</span>
      <span className="min-w-0 flex-1 truncate text-xs text-fg-3">
        {g.member ? (
          g.member.username ? (
            <Link href={`/@${g.member.username}`} target="_blank" className="text-brand hover:underline">
              @{g.member.username}
            </Link>
          ) : (
            "joined, no username yet"
          )
        ) : (
          "not joined yet"
        )}
        {g.note && ` · ${g.note}`}
      </span>
      {error && <span className="text-xs text-danger">{error}</span>}
      {confirming ? (
        <div className="flex items-center gap-1">
          <button type="button" onClick={() => setConfirming(false)} className="rounded-lg px-2 py-1.5 text-xs text-fg-3 hover:text-fg">
            Keep
          </button>
          <button
            type="button"
            disabled={removing}
            onClick={() => void remove()}
            className="rounded-lg bg-danger/15 px-2.5 py-1.5 text-xs text-danger transition-colors hover:bg-danger/25 disabled:opacity-50"
          >
            {removing ? "Removing…" : "Remove"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          aria-label="Remove grant"
          title="Remove grant"
          onClick={() => setConfirming(true)}
          className="flex size-8 items-center justify-center rounded-lg text-fg-3 transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <Icon icon={Delete02Icon} size={16} />
        </button>
      )}
    </li>
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
