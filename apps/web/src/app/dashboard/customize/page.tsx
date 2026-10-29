"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { useQueryClient } from "@tanstack/react-query";
import { defaultSettings, type EditableProfile, type LinkedWallet, type ProfileTheme, type Tier, type Widget, type WidgetSize, type WidgetType } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { Spinner } from "@/components/dashboard/Panel";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { Inspector } from "@/components/editor/Inspector";
import { Library } from "@/components/editor/Library";
import { ProfileView } from "@/components/profile/ProfileView";
import { backdropStyle, cursorStyle } from "@/components/profile/theme";
import { buttonClass, FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { pickImage, useUpload } from "@/lib/upload";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

export default function CustomizePage() {
  const { data: me } = useMe();
  const { data, isLoading } = useEditorProfile();
  if (isLoading || !data || !me) return <Spinner />;
  return <Editor initial={data} tier={me.tier} wallets={me.linkedWallets} />;
}

function Editor({ initial, tier, wallets }: { initial: EditorPayload; tier: Tier; wallets: LinkedWallet[] }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const avatar = useUpload("avatar");
  const qc = useQueryClient();
  const [saved, setSaved] = useState(initial.profile);
  const [draft, setDraft] = useState<EditableProfile>(initial.profile);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved]);
  const selected = draft.widgets.find((w) => w.id === selectedId) ?? null;

  const [nudge, setNudge] = useState(0);
  const [savedFlash, setSavedFlash] = useState(false);

  const setWidgets = (fn: (ws: Widget[]) => Widget[]) => setDraft((d) => ({ ...d, widgets: fn(d.widgets) }));

  const addWidget = (type: WidgetType, size: WidgetSize) => {
    const w: Widget = { id: crypto.randomUUID(), type, size, settings: defaultSettings(type) };
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
      setNudge(0);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
      qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile: next } : old));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const changeAvatar = async () => {
    const file = await pickImage();
    if (!file) return;
    const url = await avatar.upload(file);
    if (!url) return setError(avatar.error);
    // The picture saves right away, like in Settings.
    const profile = await api<EditableProfile>("/me/identity", { method: "PATCH", token: await getToken(), json: { avatarUrl: url } });
    setSaved((s) => ({ ...s, avatarUrl: profile.avatarUrl }));
    setDraft((d) => ({ ...d, avatarUrl: profile.avatarUrl }));
    qc.setQueryData<EditorPayload>(["profile"], (old) => (old ? { ...old, profile: { ...old.profile, avatarUrl: profile.avatarUrl } } : old));
  };

  const discard = () => {
    setDraft(saved);
    setError(null);
    setNudge(0);
  };

  // Leaving with unsaved changes shakes the bar instead of a browser prompt.
  const back = () => {
    if (dirty) return setNudge((n) => n + 1);
    router.push("/dashboard/analytics");
  };

  return (
    // Full-screen customize mode: no dashboard sidebar, a back button instead.
    <div className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-[#0b0b0b] lg:overflow-hidden">
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b0b0b]/95 px-3 backdrop-blur md:px-4">
        <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm text-fg-2 transition-colors hover:bg-white/5 hover:text-fg">
          <Icon icon={ArrowLeft01Icon} size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <span className="h-5 w-px bg-white/10" />
        <Image src="/images/fl3x-icon.svg" alt="" width={18} height={19} />
        <h1 className="font-primary text-xl leading-none">Customize</h1>
        <span className="hidden items-center gap-1.5 rounded-full bg-brand/15 px-2.5 py-1 text-[11px] text-brand sm:flex">
          <span className="size-1.5 animate-pulse rounded-full bg-brand" />
          Editing @{draft.username}
        </span>
        <div className="ml-auto flex items-center gap-2">
          {error && !dirty && <FieldError>{error}</FieldError>}
          {avatar.busy && <span className="text-xs text-fg-3">Uploading…</span>}
          <Link href={`/@${draft.username}`} target="_blank" className={buttonClass({ variant: "secondary", size: "md" })}>
            View profile
          </Link>
        </div>
      </header>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <aside className="border-white/10 bg-[#0b0b0b] p-4 lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-r">
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

        <section className="relative flex min-h-[70svh] min-w-0 flex-1 flex-col bg-[#1a1a1a] lg:min-h-0" style={{ ...backdropStyle(draft.theme), cursor: cursorStyle(draft.theme) }}>
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8" onClick={() => setSelectedId(null)}>
            {/* my-auto centers when it fits, and scrolls from the top when it doesn't */}
            <FitWidth onClick={(e) => e.stopPropagation()} className="my-auto">
              <ProfileView
                profile={draft}
                tier={tier}
                views={0}
                editor={{
                  selectedId,
                  onSelect: setSelectedId,
                  onMove: move,
                  onAvatar: () => void changeAvatar(),
                  onIdentity: (patch) => setDraft((d) => ({ ...d, ...patch })),
                }}
              />
            </FitWidth>
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
          />
        </aside>
      </div>

      <UnsavedBar dirty={dirty} saving={saving} savedFlash={savedFlash} error={error} nudge={nudge} onDiscard={discard} onSave={() => void save()} />
    </div>
  );
}

/**
 * Shrinks its child (CSS zoom) when it is wider than the available space,
 * so the preview keeps the real profile proportions instead of squeezing widgets.
 */
function FitWidth({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: React.MouseEventHandler }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const current = useRef(1);
  useEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const fit = () => {
      // The rendered width already includes the zoom: divide it back out to get the natural width.
      const natural = i.getBoundingClientRect().width / current.current;
      const next = Math.min(1, o.clientWidth / Math.max(1, natural));
      if (Math.abs(next - current.current) > 0.005) setZoom((current.current = next));
    };
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    ro.observe(i);
    fit();
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={outer} className={cn("flex w-full justify-center", className)} onClick={onClick}>
      <div ref={inner} className="w-full md:w-auto" style={{ zoom }}>
        {children}
      </div>
    </div>
  );
}
