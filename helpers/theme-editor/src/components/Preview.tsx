import { memo, useMemo, type CSSProperties, type MouseEvent } from "react";
import { SLOT_INFO, SLOTS, type Palette, type Slot } from "../lib/scheme";
import { DesktopPreview, EditorPreview, GtkPreview, QtPreview, TerminalPreview, TuiPreview } from "./previews/mocks";

export type Tab = "terminal" | "gtk" | "tui" | "qt" | "editor" | "desktop";
export type View = "both" | "old" | "edited";

const TABS: { id: Tab; label: string; Mock: () => React.JSX.Element }[] = [
  { id: "terminal", label: "Terminal", Mock: TerminalPreview },
  { id: "gtk", label: "GTK", Mock: GtkPreview },
  { id: "tui", label: "TUI", Mock: TuiPreview },
  { id: "qt", label: "Qt", Mock: QtPreview },
  { id: "editor", label: "Editor", Mock: EditorPreview },
  { id: "desktop", label: "Desktop", Mock: DesktopPreview },
];

const VIEWS: { id: View; label: string }[] = [
  { id: "both", label: "Side by side" },
  { id: "old", label: "Old" },
  { id: "edited", label: "Edited" },
];

const vars = (p: Palette) => Object.fromEntries(SLOTS.map((s) => [`--${s}`, p[s]])) as CSSProperties;

export function Preview({ tab, view, old, oldLabel, edited, trying, highlight, canReset, onTab, onView, onPick, onHover, onReset }: {
  tab: Tab;
  view: View;
  old: Palette;
  oldLabel: string;
  edited: Palette;
  trying: boolean;
  highlight: Slot | null;
  canReset: boolean;
  onTab: (t: Tab) => void;
  onView: (v: View) => void;
  onPick: (s: Slot) => void;
  onHover: (s: Slot | null) => void;
  onReset: () => void;
}) {
  const Mock = useMemo(() => memo(TABS.find((t) => t.id === tab)!.Mock), [tab]);

  // Mock elements name their colours in data-s, so one handler covers them all
  const slotAt = (e: MouseEvent) => (e.target as HTMLElement).closest<HTMLElement>("[data-s]")?.dataset.s?.split(" ")[0] as Slot | undefined;
  const handlers = {
    onClick: (e: MouseEvent) => { const s = slotAt(e); if (s) onPick(s); },
    onMouseOver: (e: MouseEvent) => onHover(slotAt(e) ?? null),
    onMouseLeave: () => onHover(null),
  };

  return (
    <section className="preview">
      <div className="preview-bar">
        <div className="tabs" role="tablist" aria-label="Preview">
          {TABS.map((t) => (
            <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? "on" : ""} onClick={() => onTab(t.id)}>{t.label}</button>
          ))}
        </div>
        <span className="grow" />
        <div className="seg" role="group" aria-label="Show">
          {VIEWS.map((v) => <button key={v.id} className={view === v.id ? "on" : ""} onClick={() => onView(v.id)}>{v.label}</button>)}
        </div>
      </div>
      {highlight && <style>{`.pv [data-s~="${highlight}"]{outline:1px dashed var(--mark);outline-offset:-1px}`}</style>}
      <div className={`panes ${view}`}>
        {view !== "edited" && (
          <figure className="pane">
            <figcaption>
              Old <span className="muted">{oldLabel}</span>
              {canReset && <button className="link" onClick={onReset}>Back to the saved file</button>}
            </figcaption>
            <div className="pv" style={vars(old)} {...handlers}><Mock /></div>
          </figure>
        )}
        {view !== "old" && (
          <figure className="pane">
            <figcaption>{trying ? "Trying a preset" : "Edited"}</figcaption>
            <div className="pv" style={vars(edited)} {...handlers}><Mock /></div>
          </figure>
        )}
      </div>
      <div className="preview-foot">
        {highlight ? <><code>{highlight}</code> {SLOT_INFO[highlight].name}: {SLOT_INFO[highlight].hint}</> : " "}
      </div>
    </section>
  );
}
