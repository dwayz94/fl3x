"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { defaultSettings, type EditableProfile, type ProfileTheme, type Tier, type Widget, type WidgetSize, type WidgetType } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { Spinner } from "@/components/dashboard/Panel";
import { Inspector } from "@/components/editor/Inspector";
import { Library } from "@/components/editor/Library";
import { ProfileView } from "@/components/profile/ProfileView";
import { backdropStyle } from "@/components/profile/theme";
import { Button, buttonClass, FieldError } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

export default function CustomizePage() {
  const { data: me } = useMe();
  const { data, isLoading } = useEditorProfile();
  if (isLoading || !data || !me) return <Spinner />;
  return <Editor initial={data} tier={me.tier} wallets={me.wallets} />;
}

function Editor({ initial, tier, wallets }: { initial: EditorPayload; tier: Tier; wallets: string[] }) {
  const { getToken } = useAuth();
  const qc = useQueryClient();
  const [saved, setSaved] = useState(initial.profile);
  const [draft, setDraft] = useState<EditableProfile>(initial.profile);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const selected = draft.widgets.find((w) => w.id === selectedId) ?? null;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const setWidgets = (fn: (ws: Widget[]) => Widget[]) => setDraft((d) => ({ ...d, widgets: fn(d.widgets) }));

  const addWidget = (type: WidgetType, size: WidgetSize) => {
    const w: Widget = { id: crypto.randomUUID(), type, size, settings: defaultSettings(type) };
    if ((type === "pnl" || type === "portfolio") && wallets[0]) w.settings.wallet = wallets[0];
    if (type === "clock") w.settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setWidgets((ws) => [...ws, w]);
    setSelectedId(w.id);
  };

  const move = (fromId: string, toId: string) =>
    setWidgets((ws) => {
      const from = ws.findIndex((w) => w.id === fromId);
      const to = ws.findIndex((w) => w.id === toId);
      const next = [...ws];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item!);
      return next;
    });

  const shift = (dir: -1 | 1) =>
    setWidgets((ws) => {
      const i = ws.findIndex((w) => w.id === selectedId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= ws.length) return ws;
      const next = [...ws];
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const widgets = await api<Widget[]>("/me/widgets", { method: "PUT", token, json: draft.widgets });
      const profile = await api<EditableProfile>("/me/profile", {
        method: "PUT",
        token,
        json: { displayName: draft.displayName, bio: draft.bio, avatarUrl: draft.avatarUrl, badges: draft.badges, theme: draft.theme },
      });
      const next = { ...profile, widgets };
      setSaved(next);
      setDraft(next);
      qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile: next } : old));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-svh flex-col lg:h-svh lg:flex-row">
      <aside className="border-white/10 bg-[#0b0b0b] p-4 lg:w-[280px] lg:shrink-0 lg:border-r">
        <Library
          draft={draft}
          tier={tier}
          ownedBadges={initial.ownedBadges}
          widgetLimit={initial.limits.widgets}
          onAddWidget={addWidget}
          onTheme={(patch: Partial<ProfileTheme>) => setDraft((d) => ({ ...d, theme: { ...d.theme, ...patch } }))}
          onBadges={(badges) => setDraft((d) => ({ ...d, badges }))}
        />
      </aside>

      <section className="relative flex min-w-0 flex-1 flex-col bg-[#1a1a1a]" style={backdropStyle(draft.theme)}>
        <div className="z-20 flex shrink-0 items-center justify-end gap-3 p-4">
          {error && <FieldError>{error}</FieldError>}
          {dirty && !error && <span className="text-xs text-fg-2">Unsaved changes</span>}
          <Link href={`/@${draft.username}`} target="_blank" className={buttonClass({ variant: "secondary", size: "md" })}>
            View
          </Link>
          <Button size="md" onClick={save} loading={saving} disabled={!dirty}>
            Save
          </Button>
        </div>
        <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 pt-2 pb-16" onClick={() => setSelectedId(null)}>
          {/* my-auto centers when it fits, and scrolls from the top when it doesn't */}
          <div onClick={(e) => e.stopPropagation()} className="my-auto w-full max-w-[760px]">
            <ProfileView profile={draft} tier={tier} views={0} editor={{ selectedId, onSelect: setSelectedId, onMove: move }} />
          </div>
        </div>
      </section>

      <aside className="border-white/10 bg-[#0b0b0b] p-5 lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-l">
        <Inspector
          draft={draft}
          selected={selected}
          wallets={wallets}
          onWidget={(patch) => setWidgets((ws) => ws.map((w) => (w.id === selectedId ? { ...w, ...patch } : w)))}
          onRemove={() => {
            setWidgets((ws) => ws.filter((w) => w.id !== selectedId));
            setSelectedId(null);
          }}
          onShift={shift}
          onProfile={(patch) => setDraft((d) => ({ ...d, ...patch }))}
        />
      </aside>
    </div>
  );
}
