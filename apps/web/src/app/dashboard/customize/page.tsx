"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft01Icon, ViewIcon, ViewOffSlashIcon } from "@hugeicons/core-free-icons";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { motion } from "motion/react";
import { defaultSettings, type EditableProfile, type LinkedWallet, type ProfileTheme, type Tier, type Widget, type WidgetSize, type WidgetType } from "@fl3x/shared";
import { useAuth, useMe } from "@/components/auth/AuthProvider";
import { UnsavedBar } from "@/components/dashboard/UnsavedBar";
import { Inspector } from "@/components/editor/Inspector";
import { Library } from "@/components/editor/Library";
import { ProfileView } from "@/components/profile/ProfileView";
import { AnimatedBackdrop } from "@/components/profile/AnimatedBackdrop";
import { backdropStyle, cursorStyle } from "@/components/profile/theme";
import { FieldError, Icon } from "@/components/ui";
import { api, ApiRequestError } from "@/lib/api";
import { cn } from "@/lib/cn";
import { pickImage, useUpload } from "@/lib/upload";
import { useEditorProfile, type EditorPayload } from "@/lib/use-profile";

const EASE = [0.22, 1, 0.36, 1] as const;

export default function CustomizePage() {
  const { data: me } = useMe();
  const { data, isLoading } = useEditorProfile();
  if (isLoading || !data || !me) return <CustomizeLoader />;
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
  const [preview, setPreview] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const setWidgets = (fn: (ws: Widget[]) => Widget[]) => setDraft((d) => ({ ...d, widgets: fn(d.widgets) }));

  const makeWidget = (type: WidgetType, size: WidgetSize): Widget => {
    const w: Widget = { id: crypto.randomUUID(), type, size, settings: defaultSettings(type) };
    if (type === "clock") w.settings.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return w;
  };

  const addWidget = (type: WidgetType, size: WidgetSize) => {
    // A click right after dragging a tile isn't a second add.
    if (justDragged.current) return;
    const w = makeWidget(type, size);
    setWidgets((ws) => [...ws, w]);
    setSelectedId(w.id);
  };

  /**
   * Drag a widget from the library onto the card: a slot opens where the
   * pointer is (the others make room), dropping places it. Outside the card
   * the slot goes away and nothing is added.
   */
  const [incomingId, setIncomingId] = useState<string | null>(null);
  const justDragged = useRef(false);
  // Leaving the page mid-drag must not leave listeners or the ghost behind.
  const endDrag = useRef<(() => void) | null>(null);
  useEffect(() => () => endDrag.current?.(), []);
  const dragFromLibrary = (type: WidgetType, size: WidgetSize, e: React.PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || e.pointerType === "touch") return; // touch scrolls the library; a tap still adds
    const tile = e.currentTarget;
    const start = { x: e.clientX, y: e.clientY };
    let ghost: HTMLElement | null = null;
    let id: string | null = null;
    let last: string | null = null;
    let frame = 0;
    let pointer = start;

    const tick = () => {
      frame = 0;
      if (!ghost) return;
      ghost.style.translate = `${pointer.x - start.x}px ${pointer.y - start.y}px`;
      const hits = document.elementsFromPoint(pointer.x, pointer.y);
      const overCard = hits.some((h) => h.closest("article"));
      let slot: string | null = null;
      for (const h of hits) {
        const el = (h as HTMLElement).closest<HTMLElement>("[data-slot]");
        if (el && el.dataset.slot !== id) {
          slot = el.dataset.slot!;
          break;
        }
      }
      if (overCard && !id) {
        const w = makeWidget(type, size);
        id = w.id;
        last = slot;
        setWidgets((ws) => {
          const at = slot ? ws.findIndex((x) => x.id === slot) : -1;
          return at < 0 ? [...ws, w] : [...ws.slice(0, at), w, ...ws.slice(at)];
        });
        setIncomingId(w.id);
      } else if (overCard && id && slot && slot !== last) {
        last = slot;
        move(id, slot);
      } else if (overCard && !slot) {
        last = null;
      } else if (!overCard && id) {
        const gone = id;
        id = null;
        setWidgets((ws) => ws.filter((x) => x.id !== gone));
        setIncomingId(null);
      }
    };
    const onMove = (ev: PointerEvent) => {
      pointer = { x: ev.clientX, y: ev.clientY };
      if (!ghost) {
        if (Math.hypot(ev.clientX - start.x, ev.clientY - start.y) < 6) return;
        const r = tile.getBoundingClientRect();
        ghost = tile.cloneNode(true) as HTMLElement;
        Object.assign(ghost.style, {
          position: "fixed", left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px`,
          margin: "0", zIndex: "100", pointerEvents: "none", opacity: "0.95", scale: "1.04", rotate: "-1.5deg",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)", willChange: "translate",
        });
        document.body.appendChild(ghost);
        document.body.style.cursor = "grabbing";
      }
      ev.preventDefault();
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const detach = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      cancelAnimationFrame(frame);
      document.body.style.cursor = "";
      ghost?.remove();
      endDrag.current = null;
    };
    const onUp = () => {
      const dragged = !!ghost;
      detach();
      if (!dragged) return;
      justDragged.current = true;
      setTimeout(() => (justDragged.current = false), 0);
      setIncomingId(null);
      if (id) setSelectedId(id);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    endDrag.current = detach;
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
  // Entering and leaving Customize animate (panels slide in from their side, the card zooms in).
  const [leaving, setLeaving] = useState(false);
  // Everything appears together once the widgets' data and the background are in.
  const ready = useReady(draft.theme.background === "image" ? draft.theme.backgroundUrl : undefined);
  const shown = ready && !leaving;
  const back = () => {
    if (dirty) return setNudge((n) => n + 1);
    setLeaving(true);
    setTimeout(() => router.push("/dashboard/analytics"), 260);
  };

  return (
    // Full-screen customize mode: no dashboard sidebar, a back button instead.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: shown ? 1 : 0 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="fixed inset-0 z-30 flex flex-col overflow-y-auto bg-[#0b0b0b] lg:overflow-hidden"
    >
      <motion.header
        initial={{ y: -24, opacity: 0 }}
        animate={shown ? { y: 0, opacity: 1 } : { y: -24, opacity: 0 }}
        transition={{ duration: 0.4, ease: EASE }}
        className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/10 bg-[#0b0b0b]/95 px-3 backdrop-blur md:px-4"
      >
        <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-xl px-2 py-1.5 text-sm text-fg-2 transition-colors hover:bg-white/5 hover:text-fg">
          <Icon icon={ArrowLeft01Icon} size={18} />
          <span className="hidden sm:inline">Dashboard</span>
        </button>
        <span className="h-5 w-px bg-white/10" />
        <Image src="/images/fl3x-icon.svg" alt="" width={18} height={19} />
        <h1 className="font-primary text-xl leading-none">Customize</h1>
        <div className="ml-auto flex items-center gap-2">
          {error && !dirty && <FieldError>{error}</FieldError>}
          {avatar.busy && <span className="text-xs text-fg-3">Uploading…</span>}
          {/* Hides both panels to see the card about as visitors will. */}
          <button
            type="button"
            onClick={() => {
              setPreview((p) => !p);
              setSelectedId(null);
            }}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm text-fg-2 transition-colors hover:bg-white/5 hover:text-fg"
          >
            <Icon icon={preview ? ViewOffSlashIcon : ViewIcon} size={18} />
            <span className="hidden sm:inline">{preview ? "Show panels" : "Hide panels"}</span>
          </button>
        </div>
      </motion.header>

      <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:flex-row">
        <motion.aside
          data-hidden={preview}
          initial={{ x: -40, opacity: 0 }}
          animate={shown ? { x: 0, opacity: 1 } : { x: -40, opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="border-white/10 bg-[#0b0b0b] p-4 data-[hidden=true]:hidden lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-r"
        >
          <Library
            draft={draft}
            tier={tier}
            ownedBadges={initial.ownedBadges}
            widgetLimit={initial.limits.widgets}
            onAddWidget={addWidget}
            onDragWidget={dragFromLibrary}
            onTheme={(patch: Partial<ProfileTheme>) => setDraft((d) => ({ ...d, theme: { ...d.theme, ...patch } }))}
            onBadges={(badges) => setDraft((d) => ({ ...d, badges }))}
          />
        </motion.aside>

        <section className="relative isolate flex min-h-[70svh] min-w-0 flex-1 flex-col bg-[#1a1a1a] lg:min-h-0" style={{ ...backdropStyle(draft.theme), cursor: cursorStyle(draft.theme) }}>
          <AnimatedBackdrop theme={draft.theme} className="absolute inset-0 -z-10" />
          <div className="flex flex-1 flex-col items-center overflow-y-auto px-4 py-8" onClick={() => setSelectedId(null)}>
            {/* my-auto centers when it fits, and scrolls from the top when it doesn't */}
            <motion.div
              // No scale: FitWidth measures the card's on-screen width to size the preview.
              initial={{ y: 32, opacity: 0 }}
              animate={shown ? { y: 0, opacity: 1 } : { y: 16, opacity: 0 }}
              transition={leaving ? { duration: 0.22, ease: EASE } : { type: "spring", stiffness: 260, damping: 28 }}
              className="my-auto flex w-full justify-center"
            >
            <FitWidth onClick={(e) => e.stopPropagation()}>
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
                  incomingId,
                }}
              />
            </FitWidth>
            </motion.div>
          </div>
        </section>

        <motion.aside
          data-hidden={preview}
          initial={{ x: 40, opacity: 0 }}
          animate={shown ? { x: 0, opacity: 1 } : { x: 40, opacity: 0 }}
          transition={{ duration: 0.45, ease: EASE }}
          className="border-white/10 bg-[#0b0b0b] p-5 data-[hidden=true]:hidden lg:w-[300px] lg:shrink-0 lg:overflow-y-auto lg:border-l"
        >
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
        </motion.aside>
      </div>

      {!ready && <CustomizeLoader />}
      <UnsavedBar dirty={dirty} saving={saving} savedFlash={savedFlash} error={error} nudge={nudge} onDiscard={discard} onSave={() => void save()} />
    </motion.div>
  );
}

/**
 * True once nothing is loading anymore (widget data, background image), or
 * after 4 s at most so a slow source never blocks the editor.
 */
function useReady(backgroundUrl?: string) {
  const fetching = useIsFetching();
  const [bgDone, setBgDone] = useState(!backgroundUrl);
  const [timeUp, setTimeUp] = useState(false);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!backgroundUrl) return;
    const img = new window.Image();
    img.onload = img.onerror = () => setBgDone(true);
    img.src = backgroundUrl;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    const t = setTimeout(() => setTimeUp(true), 4000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (ready || !(timeUp || (fetching === 0 && bgDone))) return;
    // A short settle so queries that start right after mount are counted.
    const t = setTimeout(() => setReady(true), 200);
    return () => clearTimeout(t);
  }, [fetching, bgDone, timeUp, ready]);
  return ready;
}

/** Shown while Customize gets everything ready, instead of pieces popping in one by one. */
function CustomizeLoader() {
  return (
    <div className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#0b0b0b]">
      <Image src="/images/fl3x-icon.svg" alt="" width={40} height={43} className="animate-pulse" />
      <p className="text-xs text-fg-3">Loading your profile…</p>
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
