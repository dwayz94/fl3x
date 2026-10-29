"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Delete02Icon } from "@hugeicons/core-free-icons";
import { buildLinkUrl, handleFromInput, isValidLinkHandle, LINK_KINDS, type LinkKind, type ProfileLink } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { PageHeader, Spinner } from "@/components/dashboard/Panel";
import { inputClass } from "@/components/editor/Field";
import { linkIcons } from "@/components/profile/links";
import { Button, FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

type Draft = Omit<ProfileLink, "id"> & { id?: string };

export default function LinksPage() {
  const { data } = useEditorProfile();
  if (!data) return <Spinner />;
  return <LinksEditor initial={data.profile.links} limit={data.limits.links} />;
}

function LinksEditor({ initial, limit }: { initial: ProfileLink[]; limit: number }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [links, setLinks] = useState<Draft[]>(initial);
  const [kind, setKind] = useState<LinkKind | null>(null);
  const [handle, setHandle] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(links) !== JSON.stringify(initial);

  const pick = (k: LinkKind) => {
    setKind(k);
    setHandle("");
    setLabel("");
    setError(null);
  };

  const add = () => {
    const h = handleFromInput(kind!, handle);
    if (!isValidLinkHandle(kind!, h)) return setError(`That doesn't look like a valid ${LINK_KINDS.find((l) => l.id === kind)!.label} handle`);
    setError(null);
    setLinks((ls) => [...ls, { kind: kind!, url: buildLinkUrl(kind!, h), label: kind === "custom" || kind === "website" ? label || null : null }]);
    setKind(null);
    setHandle("");
  };
  const current = LINK_KINDS.find((l) => l.id === kind);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = await api<ProfileLink[]>("/me/links", { method: "PUT", token: await getToken(), json: links });
      setLinks(next);
      qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile: { ...old.profile, links: next } } : old));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-10">
      <PageHeader
        title="L[i]NKS"
        subtitle={`The icons under your profile. ${links.length}/${limit} used.`}
        action={
          <Button size="md" onClick={save} loading={saving} disabled={!dirty}>
            Save links
          </Button>
        }
      />

      <div className="flex flex-wrap gap-3">
        {LINK_KINDS.map((l) => (
          <button
            key={l.id}
            type="button"
            title={l.label}
            disabled={links.length >= limit}
            onClick={() => pick(l.id)}
            className={cn(
              "flex size-14 items-center justify-center rounded-2xl border bg-[#0d0d0d] transition-colors disabled:opacity-40",
              kind === l.id ? "border-brand text-brand" : "border-white/10 text-fg-2 hover:border-white/25 hover:text-fg",
            )}
          >
            <Icon icon={linkIcons[l.id]} size={24} />
          </button>
        ))}
      </div>

      {kind && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(90deg,#0d0d0d_40%,#2a1420)] p-5">
          <p className="mr-auto font-primary text-2xl leading-none">{LINK_KINDS.find((l) => l.id === kind)!.label}</p>
          {(kind === "custom" || kind === "website") && (
            <input className={cn(inputClass, "w-40")} placeholder="Label" maxLength={40} value={label} onChange={(e) => setLabel(e.target.value)} />
          )}
          <div className={cn(inputClass, "flex w-80 items-center gap-0 pr-0 focus-within:border-brand")}>
            <span className="shrink-0 text-fg-3">{current?.prefix || "https://"}</span>
            <input
              className="h-full min-w-0 flex-1 bg-transparent outline-none placeholder:text-fg-3"
              placeholder={current?.placeholder}
              value={handle}
              // Pasting a full link keeps only the handle.
              onChange={(e) => {
                const v = e.target.value;
                const pasted = /^(https?:\/\/|www\.)/.test(v) || (current?.prefix && v.startsWith(current.prefix));
                setHandle(pasted ? handleFromInput(kind, v) : v);
              }}
              onKeyDown={(e) => e.key === "Enter" && add()}
              autoFocus
              spellCheck={false}
              autoCapitalize="none"
            />
          </div>
          <Button size="md" onClick={add}>
            Add
          </Button>
        </div>
      )}
      {error && <div className="mt-3"><FieldError>{error}</FieldError></div>}

      <div className="mt-8 flex flex-col gap-2">
        {links.length === 0 && <p className="text-sm text-fg-3">No links yet. Pick a network above.</p>}
        {links.map((l, i) => (
          <div key={l.id ?? `new-${i}`} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0d0d] px-4 py-3">
            <Icon icon={linkIcons[l.kind]} size={20} className="text-fg-2" />
            <span className="min-w-0 flex-1 truncate text-sm">
              {l.label && <span className="mr-2 text-fg">{l.label}</span>}
              <span className="text-fg-2">{l.url}</span>
            </span>
            <button type="button" aria-label="Remove" onClick={() => setLinks((ls) => ls.filter((_, j) => j !== i))} className="rounded-lg p-1.5 text-danger hover:bg-white/10">
              <Icon icon={Delete02Icon} size={18} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
