"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Download01Icon, Logout01Icon, NewTwitterIcon } from "@hugeicons/core-free-icons";
import type { EditableProfile, Me } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { LoadError, PageHeader, Spinner } from "@/components/dashboard/Panel";
import { ConnectionsPanel } from "@/components/dashboard/ConnectionsPanel";
import { CopyField } from "@/components/dashboard/CopyField";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { WalletsPanel } from "@/components/dashboard/WalletsPanel";
import { inputClass } from "@/components/editor/Field";
import { FieldError, Icon, ImageInput, Verified } from "@/components/ui";
import { site } from "@/config/site";
import { api, ApiRequestError } from "@/lib/api";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

/** Settings fit one screen on desktop: profile on the left, wallets and accounts on the right. */
export default function SettingsPage() {
  const { data: me } = useMe();
  if (!me) return <Spinner />;

  return (
    <div className="flex flex-col px-4 py-8 md:px-8 lg:h-svh lg:py-6">
      <PageHeader title="S[e]TT[i]NGS" subtitle="Your profile, wallets and connected accounts." />
      <div className="grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Card title="Profile" desc="What visitors see at the top of your card.">
          <IdentityForm me={me} />
        </Card>

        <div className="flex flex-col gap-4 lg:min-h-0">
          {/* Sized to its wallets; scrolls only when there are more than the column can hold. */}
          <Card title="Wallets" desc="Proven with a free signature. Wallet widgets add them all up." className="lg:min-h-0" scroll>
            <WalletsPanel me={me} />
          </Card>
          <Card title="Connections" desc="Keeps your music widget playing what you listen to.">
            <Suspense>
              <ConnectionsPanel />
            </Suspense>
          </Card>
          <Account me={me} />
        </div>
      </div>
    </div>
  );
}

function Card({ title, desc, children, className, scroll }: { title: string; desc: string; children: ReactNode; className?: string; scroll?: boolean }) {
  return (
    <section className={`flex flex-col rounded-3xl bg-[#0d0d0d] p-5 ${className ?? ""}`}>
      <div className="mb-4">
        <h2 className="font-primary text-2xl leading-none">{title}</h2>
        <p className="mt-1 text-xs text-fg-3">{desc}</p>
      </div>
      <div className={scroll ? "-mr-2 min-h-0 flex-1 overflow-y-auto pr-2" : "flex-1"}>{children}</div>
    </section>
  );
}

/** Sign-in account and log out, on one line. */
function Account({ me }: { me: Me }) {
  const router = useRouter();
  const { logout, linkTwitter } = useAuth();
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  return (
    <section className="flex items-center gap-3 rounded-3xl bg-[#0d0d0d] px-5 py-4">
      <span className="flex size-9 items-center justify-center rounded-xl bg-white/5">
        <Icon icon={NewTwitterIcon} size={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm">{me.xHandle ? `@${me.xHandle}` : "X not linked"}</p>
        <p className="text-[11px] text-fg-3">
          Signed in with X ·{" "}
          <button type="button" onClick={() => setDeleting(true)} className="text-fg-3 underline-offset-2 hover:text-danger hover:underline">
            Delete account
          </button>
        </p>
      </div>
      {deleting && <DeleteAccount username={me.username ?? ""} onClose={() => setDeleting(false)} />}
      {!me.xHandle && (
        <button type="button" onClick={linkTwitter} className="rounded-xl px-3 py-2 text-sm text-brand hover:bg-white/5">
          Link X
        </button>
      )}
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          void logout().then(() => router.push("/"));
        }}
        className="flex items-center gap-2 rounded-xl bg-danger/10 px-3.5 py-2 text-sm text-danger transition-colors hover:bg-danger/20 disabled:opacity-50"
      >
        <Icon icon={Logout01Icon} size={16} />
        Log out
      </button>
    </section>
  );
}

/** Permanent deletion, confirmed by typing the username. */
function DeleteAccount({ username, onClose }: { username: string; onClose: () => void }) {
  const router = useRouter();
  const { getToken, logout } = useAuth();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const match = typed.trim().replace(/^@/, "").toLowerCase() === username.toLowerCase();

  const remove = async () => {
    setBusy(true);
    setError(null);
    try {
      await api("/me", { method: "DELETE", token: await getToken(), json: { confirm: typed } });
      await logout();
      router.replace("/");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not delete the account");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div className="w-full max-w-[420px] rounded-[28px] bg-[#121212] p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-primary text-3xl leading-none">Delete your account</h2>
        <p className="mt-3 text-sm text-fg-2">
          This removes fl3x.lol/@{username} for good: your profile, widgets, links, wallets, images, connections and analytics. Your username becomes free
          for anyone. This can&apos;t be undone.
        </p>
        <label className="mt-5 block">
          <span className="mb-1.5 block text-xs text-fg-2">
            Type <span className="text-fg">{username}</span> to confirm
          </span>
          <input className={inputClass} value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus autoComplete="off" spellCheck={false} />
        </label>
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button type="button" onClick={onClose} className="h-11 flex-1 rounded-xl bg-white/[0.08] text-sm hover:bg-white/[0.14]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!match || busy}
            onClick={() => void remove()}
            className="h-11 flex-1 rounded-xl bg-danger text-sm text-white transition-opacity disabled:opacity-30"
          >
            {busy ? "Deleting…" : "Delete forever"}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Avatar, display name and bio, with a live preview. The avatar saves on upload; text goes through the unsaved bar. */
function IdentityForm({ me }: { me: Me }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const { data, isError, refetch } = useEditorProfile();
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
  // Only when the saved name or bio change: an avatar upload also updates the cache and must keep what's being typed.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reset, [data?.profile.displayName, data?.profile.bio]);
  if (isError && !data) return <LoadError onRetry={() => void refetch()} />;
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
  const username = me.username ?? "";

  return (
    <div className="flex h-full flex-col gap-5">
      {/* Live preview of the card header, as visitors see it. */}
      <div className="flex items-center gap-5 rounded-2xl bg-white/[0.03] p-5">
        <ImageInput kind="avatar" round value={data.profile.avatarUrl ?? undefined} onChange={(url) => void patch({ avatarUrl: url })} />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 font-primary text-3xl leading-none">
            <span className="truncate">{name || username}</span>
            {me.tier === "premium" && <Verified size={20} />}
          </p>
          <p className="mt-2 line-clamp-2 text-xs text-fg-2">{bio || <span className="text-fg-3">No bio yet</span>}</p>
        </div>
      </div>
      {/* With no unsaved text the bar is hidden: an avatar error shows here instead. */}
      {error && !dirty && <FieldError>{error}</FieldError>}

      <Field label="Display name" count={`${name.length}/32`}>
        <input className={inputClass} maxLength={32} value={name} onChange={(e) => setName(e.target.value)} placeholder={username} />
      </Field>
      <Field label="Bio" count={`${bio.length}/160`}>
        <textarea className={`${inputClass} h-24 resize-none py-2.5`} maxLength={160} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="FL3X on all screens!" />
      </Field>
      <Field label="Your profile">
        <div className="flex gap-2">
          <div className="min-w-0 flex-1">
            <CopyField value={`${site.url}/@${username}`} display={`${site.domain}/@${username}`} />
          </div>
          {/* The share card as a PNG, to post on X. */}
          <a
            href={`/u/${username}/card`}
            download={`fl3x-${username}.png`}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-white/[0.08] px-3 text-sm hover:bg-white/[0.14]"
          >
            <Icon icon={Download01Icon} size={16} />
            Download card
          </a>
        </div>
      </Field>
      <p className="mt-auto text-[11px] text-fg-3">Tip: you can also click your name or bio on the card in Customize.</p>
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
