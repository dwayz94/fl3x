"use client";

import { ArrowDown02Icon, ArrowUp02Icon, CursorEdit01Icon, Delete02Icon, DragDropIcon, Image01Icon, PlusSignIcon, TextIcon } from "@hugeicons/core-free-icons";
import { WIDGETS, fieldShown, widgetProblems, type EditableProfile, type FieldDef, type LinkedWallet, type Widget, type WidgetSize } from "@fl3x/shared";
import { Brand, Icon } from "@/components/ui";
import { WidgetHost } from "@/lib/use-portfolio";
import { WidgetView } from "@/components/widgets";
import { cn } from "@/lib/cn";
import { Field, Label, Segmented } from "./Field";

const TIPS = [
  { icon: PlusSignIcon, title: "Add", text: "Pick a widget on the left. It shows up at the end of your card." },
  { icon: DragDropIcon, title: "Move", text: "Drag a widget: the others make room as you go. On a phone, hold it first." },
  { icon: CursorEdit01Icon, title: "Edit", text: "Click a widget to change its content, size and style here." },
  { icon: TextIcon, title: "Name & bio", text: "Click your name or bio on the card and type." },
  { icon: Image01Icon, title: "Picture", text: "Click your avatar on the card to upload a new one." },
];

export function Inspector(props: {
  draft: EditableProfile;
  selected: Widget | null;
  wallets: LinkedWallet[];
  /** Premium unlocks the Premium-only widget options (color backgrounds…). */
  premium: boolean;
  onWidget: (patch: Partial<Widget>) => void;
  onRemove: () => void;
  onShift: (dir: -1 | 1) => void;
}) {
  const w = props.selected;

  if (!w) {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="border-b border-white/10 pb-5 text-3xl">
          <Brand>[e]D[i]T</Brand>
        </h2>
        {TIPS.map((t) => (
          <div key={t.title} className="flex gap-3 rounded-2xl bg-white/[0.04] p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Icon icon={t.icon} size={18} />
            </span>
            <div className="min-w-0">
              <p className="font-primary text-lg leading-none">{t.title}</p>
              <p className="mt-1 text-xs text-fg-2">{t.text}</p>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const def = WIDGETS[w.type];
  const problems = widgetProblems(w, props.wallets.map((x) => x.address));
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
          {/* "editor": unsaved widgets read the member's own wallets, like the card in the middle. */}
          <WidgetHost.Provider value="editor">
            <WidgetView w={w} interactive={false} />
          </WidgetHost.Provider>
        </div>
      </div>
      {problems.length > 0 && (
        // Until this is filled in, the profile can't be saved.
        <div className="rounded-xl border border-[#FFB547]/40 bg-[#FFB547]/10 px-3 py-2.5 text-xs text-[#FFD08A]">
          <p className="font-primary text-sm text-[#FFB547]">To finish this widget</p>
          <ul className="mt-1 list-disc pl-4">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="border-b border-dashed border-white/10 pb-5">
        <Label>Size</Label>
        <Segmented options={[{ id: "long", label: "Long card" }, { id: "large", label: "Large card" }]} value={w.size} onChange={(v) => props.onWidget({ size: v as WidgetSize })} />
      </div>
      {/* Fields that depend on another (a color only once "Color" is picked…) appear when they apply. */}
      {(def.fields as readonly FieldDef[]).filter((f) => fieldShown(w.type, f, w.settings)).map((f) => (
        <Field
          key={f.key}
          def={f}
          value={w.settings[f.key]}
          settings={w.settings}
          wallets={props.wallets}
          premium={props.premium}
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
