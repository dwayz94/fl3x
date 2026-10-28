"use client";

import { ArrowDown02Icon, ArrowUp02Icon, Delete02Icon } from "@hugeicons/core-free-icons";
import { WIDGETS, type EditableProfile, type FieldDef, type Widget, type WidgetSize } from "@fl3x/shared";
import { Brand, Icon } from "@/components/ui";
import { WidgetView } from "@/components/widgets";
import { cn } from "@/lib/cn";
import { Field, inputClass, Label, Segmented } from "./Field";

export function Inspector(props: {
  draft: EditableProfile;
  selected: Widget | null;
  wallets: string[];
  onWidget: (patch: Partial<Widget>) => void;
  onRemove: () => void;
  onShift: (dir: -1 | 1) => void;
  onProfile: (patch: Partial<Pick<EditableProfile, "displayName" | "bio" | "avatarUrl">>) => void;
}) {
  const w = props.selected;

  if (!w) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="border-b border-white/10 pb-5 text-3xl">
          <Brand>PR[o]F[i]Le</Brand>
        </h2>
        <div>
          <Label>Display name</Label>
          <input className={inputClass} maxLength={32} value={props.draft.displayName ?? ""} placeholder={props.draft.username} onChange={(e) => props.onProfile({ displayName: e.target.value })} />
        </div>
        <div>
          <Label>Bio</Label>
          <textarea className={cn(inputClass, "h-24 resize-none py-2")} maxLength={160} value={props.draft.bio ?? ""} placeholder="FL3X on all screens!" onChange={(e) => props.onProfile({ bio: e.target.value })} />
        </div>
        <div>
          <Label>Avatar URL</Label>
          <input className={inputClass} value={props.draft.avatarUrl ?? ""} placeholder="https://…" onChange={(e) => props.onProfile({ avatarUrl: e.target.value })} />
          <p className="mt-1.5 text-[11px] text-fg-3">Defaults to your X picture. Uploads are coming.</p>
        </div>
        <p className="rounded-xl bg-white/5 p-3 text-xs text-fg-2">Click a widget in the preview to edit it. Drag widgets to reorder them.</p>
      </div>
    );
  }

  const def = WIDGETS[w.type];
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-white/10 pb-5">
        <h2 className="font-primary text-3xl leading-none">{def.name}</h2>
        <div className="flex gap-1">
          <IconBtn label="Move earlier" onClick={() => props.onShift(-1)} icon={ArrowUp02Icon} />
          <IconBtn label="Move later" onClick={() => props.onShift(1)} icon={ArrowDown02Icon} />
          <IconBtn label="Delete widget" onClick={props.onRemove} icon={Delete02Icon} danger />
        </div>
      </div>
      <div className="pointer-events-none mx-auto grid w-full max-w-[240px] auto-rows-[56px] grid-cols-4 gap-1.5">
        <div className={w.size === "large" ? "col-span-2 col-start-2 row-span-3" : "col-span-4 row-span-2"}>
          <WidgetView w={w} interactive={false} />
        </div>
      </div>
      <div className="border-b border-dashed border-white/10 pb-5">
        <Label>Size</Label>
        <Segmented options={[{ id: "long", label: "Long card" }, { id: "large", label: "Large card" }]} value={w.size} onChange={(v) => props.onWidget({ size: v as WidgetSize })} />
      </div>
      {(def.fields as readonly FieldDef[]).map((f) => (
        <Field
          key={f.key}
          def={f}
          value={w.settings[f.key]}
          wallets={props.wallets}
          onChange={(v) => props.onWidget({ settings: { ...w.settings, [f.key]: v } })}
        />
      ))}
    </div>
  );
}

function IconBtn({ label, onClick, icon, danger }: { label: string; onClick: () => void; icon: typeof Delete02Icon; danger?: boolean }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} className={cn("rounded-lg p-2 transition-colors hover:bg-white/10", danger ? "text-danger" : "text-fg-2")}>
      <Icon icon={icon} size={18} />
    </button>
  );
}
