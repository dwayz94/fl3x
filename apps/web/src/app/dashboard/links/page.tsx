"use client";

import { useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown01Icon, ArrowUp01Icon, Delete02Icon, DragDropVerticalIcon } from "@hugeicons/core-free-icons";
import { buildLinkUrl, handleFromInput, isValidLinkHandle, LINK_KINDS, type LinkKind, type ProfileLink } from "@fl3x/shared";
import { useAuth } from "@/components/auth/AuthProvider";
import { LoadError, PageHeader, Spinner } from "@/components/dashboard/Panel";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { inputClass } from "@/components/editor/Field";
import { linkIcons } from "@/components/profile/links";
import { Button, FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

type Draft = Omit<ProfileLink, "id"> & { id?: string };
/** A link in the editor, with a local key so new (unsaved) links can be reordered too. */
type Row = Draft & { key: string };

const withKeys = (ls: Draft[]): Row[] => ls.map((l) => ({ ...l, key: l.id ?? crypto.randomUUID() }));
const strip = (rs: Row[]): Draft[] => rs.map(({ key: _key, ...l }) => l);

export default function LinksPage() {
  const { data, isError, refetch } = useEditorProfile();
  if (isError && !data) return <LoadError onRetry={() => void refetch()} />;
  if (!data) return <Spinner />;
  return <LinksEditor initial={data.profile.links} limit={data.limits.links} />;
}

function LinksEditor({ initial, limit }: { initial: ProfileLink[]; limit: number }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [saved, setSaved] = useState<Draft[]>(initial);
  const [rows, setRows] = useState<Row[]>(() => withKeys(initial));
  const links = strip(rows);
  const [savedFlash, setSavedFlash] = useState(false);
  const [kind, setKind] = useState<LinkKind | null>(null);
  const [handle, setHandle] = useState("");
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(links) !== JSON.stringify(saved);

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
    setRows((rs) => [...rs, { key: crypto.randomUUID(), kind: kind!, url: buildLinkUrl(kind!, h), label: kind === "custom" || kind === "website" ? label || null : null }]);
    setKind(null);
    setHandle("");
  };
  const current = LINK_KINDS.find((l) => l.id === kind);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const next = await api<ProfileLink[]>("/me/links", { method: "PUT", token: await getToken(), json: links });
      setSaved(next);
      setRows(withKeys(next));
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
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
          <div className={cn(inputClass, "flex w-full items-center gap-0 pr-0 sm:w-80 focus-within:border-brand")}>
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

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        {links.length === 0 ? (
          <p className="text-sm text-fg-3">No links yet. Pick a network above.</p>
        ) : (
          // Order here = order of the icons on your profile. Drag by the handle, or use the arrows.
          <Reorder.Group axis="y" values={rows} onReorder={setRows} className="flex flex-col gap-2">
            {rows.map((r, i) => (
              <LinkRow
                key={r.key}
                row={r}
                index={i}
                count={rows.length}
                onMove={(dir) =>
                  setRows((rs) => {
                    const next = [...rs];
                    const j = i + dir;
                    [next[i], next[j]] = [next[j]!, next[i]!];
                    return next;
                  })
                }
                onRemove={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}
              />
            ))}
          </Reorder.Group>
        )}
        <aside className="h-fit rounded-2xl bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center gap-2 text-fg">
            <Icon icon={DragDropVerticalIcon} size={18} className="text-brand" />
            <p className="font-primary text-lg leading-none">Change the order</p>
          </div>
          <p className="text-xs leading-relaxed text-fg-3">
            Your icons show on your profile in this order, first one on the left. Drag a link by its handle, or use the arrows, then save.
          </p>
          {links.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-3 rounded-xl bg-black/40 p-3 text-fg-2">
              {rows.map((r) => (
                <Icon key={r.key} icon={linkIcons[r.kind]} size={20} />
              ))}
            </div>
          )}
        </aside>
      </div>

      <UnsavedBar
        dirty={dirty}
        saving={saving}
        savedFlash={savedFlash}
        error={error}
        nudge={0}
        onDiscard={() => {
          setRows(withKeys(saved));
          setError(null);
        }}
        onSave={() => void save()}
      />
    </div>
  );
}

function LinkRow({ row, index, count, onMove, onRemove }: { row: Row; index: number; count: number; onMove: (dir: -1 | 1) => void; onRemove: () => void }) {
  const drag = useDragControls();
  return (
    <Reorder.Item
      value={row}
      dragListener={false}
      dragControls={drag}
      transition={{ type: "spring", stiffness: 500, damping: 40 }}
      whileDrag={{ scale: 1.02, boxShadow: "0 18px 40px rgba(0,0,0,0.55)" }}
      className="flex items-center gap-3 rounded-2xl bg-[#0d0d0d] py-2.5 pr-3 pl-2"
    >
      <button
        type="button"
        aria-label="Drag to reorder"
        onPointerDown={(e) => drag.start(e)}
        className="cursor-grab touch-none rounded-lg p-1.5 text-fg-3 hover:bg-white/5 hover:text-fg active:cursor-grabbing"
      >
        <Icon icon={DragDropVerticalIcon} size={18} />
      </button>
      <span className="w-5 text-center font-primary text-sm text-fg-3">{index + 1}</span>
      <Icon icon={linkIcons[row.kind]} size={20} className="text-fg-2" />
      <span className="min-w-0 flex-1 truncate text-sm">
        {row.label && <span className="mr-2 text-fg">{row.label}</span>}
        <span className="text-fg-2">{row.url}</span>
      </span>
      <div className="flex">
        <button type="button" aria-label="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="rounded-lg p-1.5 text-fg-3 hover:bg-white/10 hover:text-fg disabled:opacity-25">
          <Icon icon={ArrowUp01Icon} size={18} />
        </button>
        <button type="button" aria-label="Move down" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded-lg p-1.5 text-fg-3 hover:bg-white/10 hover:text-fg disabled:opacity-25">
          <Icon icon={ArrowDown01Icon} size={18} />
        </button>
      </div>
      <button type="button" aria-label="Remove" onClick={onRemove} className="rounded-lg p-1.5 text-danger hover:bg-white/10">
        <Icon icon={Delete02Icon} size={18} />
      </button>
    </Reorder.Item>
  );
}
