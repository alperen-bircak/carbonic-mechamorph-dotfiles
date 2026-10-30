import { memo, useEffect, useRef, useState } from "react";
import { rowContrast, type Issue } from "../lib/checks";
import { isLight, NO_SHIFT, parseHex, shiftColor, type Shift } from "../lib/color";
import { GROUPS, ROW_ORDER, SLOT_INFO, type Palette, type Slot } from "../lib/scheme";
import { ColorPicker, Popover, pushRecent } from "./ColorPicker";

export function SlotTable({ palette, old, selected, hovered, issues, oldLabel, onSelect, onHover, onChange, onPaste, onRevertAll, onAdjust }: {
  palette: Palette;
  old: Palette;
  selected: Slot;
  hovered: Slot | null;
  issues: Issue[];
  oldLabel: string;
  onSelect: (s: Slot) => void;
  onHover: (s: Slot | null) => void;
  onChange: (s: Slot, hex: string) => void;
  onPaste: (s: Slot, text: string) => boolean;
  onRevertAll: (slots: Slot[]) => void;
  onAdjust: (changes: Partial<Palette>, tag: string) => void;
}) {
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const flagged = new Set(issues.map((i) => i.slot));
  const move = (from: Slot, by: number) => {
    const next = ROW_ORDER[ROW_ORDER.indexOf(from) + by];
    if (next) onSelect(next);
  };

  return (
    <div className="table" role="table" aria-label="Scheme colours">
      <div className="table-head">
        <span>Colour</span>
        <span title={oldLabel}>Old</span>
        <span>New</span>
      </div>
      {GROUPS.map((g) => {
        const changed = g.slots.filter((s) => palette[s] !== old[s]);
        return (
          <section key={g.id}>
            <header className="group-head">
              <h2>{g.title}</h2>
              {changed.length > 0 && (
                <button className="link" onClick={() => onRevertAll(changed)} title={`Put ${changed.length} changed colours back to Old`}>
                  Revert {changed.length}
                </button>
              )}
              <button className={`link ${adjusting === g.id ? "on" : ""}`} onClick={() => setAdjusting(adjusting === g.id ? null : g.id)}
                title="Shift this whole group at once">
                Adjust
              </button>
            </header>
            {adjusting === g.id && (
              <Adjust slots={g.slots} palette={palette} onChange={onAdjust} onClose={() => setAdjusting(null)} />
            )}
            {g.slots.map((s) => (
              <Row key={s} slot={s} value={palette[s]} old={old[s]} selected={selected === s} hovered={hovered === s}
                flagged={flagged.has(s)} contrast={rowContrast(s, palette)}
                onSelect={onSelect} onHover={onHover} onChange={onChange} onPaste={onPaste} onMove={move} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

const Row = memo(function Row({ slot, value, old, selected, hovered, flagged, contrast, onSelect, onHover, onChange, onPaste, onMove }: {
  slot: Slot;
  value: string;
  old: string;
  selected: boolean;
  hovered: boolean;
  flagged: boolean;
  contrast: ReturnType<typeof rowContrast>;
  onSelect: (s: Slot) => void;
  onHover: (s: Slot | null) => void;
  onChange: (s: Slot, hex: string) => void;
  onPaste: (s: Slot, text: string) => boolean;
  onMove: (s: Slot, by: number) => void;
}) {
  const info = SLOT_INFO[slot];
  const [text, setText] = useState(value);
  const [picking, setPicking] = useState(false);
  const swatch = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  // Unsaved keystrokes. Without this, a row losing focus while a new value is
  // still on its way would write its old text back over it.
  const typing = useRef(false);
  useEffect(() => {
    typing.current = false;
    setText(value);
  }, [value]);
  const row = useRef<HTMLDivElement>(null);

  // Following the selection means arrow keys, paste and clicks in a preview all
  // land on the hex field, ready for the next paste
  useEffect(() => {
    if (!selected) return;
    row.current?.scrollIntoView({ block: "nearest" });
    if (document.activeElement !== input.current) input.current?.focus({ preventScroll: true });
  }, [selected]);

  const changed = value !== old;
  const typed = parseHex(text);
  // Short forms wait for Enter or leaving the field, else typing #abc on the
  // way to #abcdef would set a colour and rewrite the field
  const commit = () => {
    if (!typing.current) return;
    typing.current = false;
    if (typed && typed !== value) onChange(slot, typed);
    else setText(value);
  };
  return (
    <div ref={row} role="row" className={`row ${selected ? "selected" : ""} ${hovered ? "hovered" : ""} ${changed ? "changed" : ""}`}
      onPointerDown={() => onSelect(slot)} onMouseEnter={() => onHover(slot)} onMouseLeave={() => onHover(null)}>
      <div className="row-name" title={`${slot}: ${info.hint}`}>
        <strong>{info.name}</strong>
        <small><code>{slot}</code> {info.hint}</small>
      </div>
      <button className="swatch old" style={{ background: old, color: isLight(old) ? "#000" : "#fff" }}
        title={changed ? `Old: ${old}. Click to go back to it` : `Old: ${old}`}
        disabled={!changed} onClick={() => onChange(slot, old)} aria-label={`${info.name}: back to old colour`}>
        {changed && <span aria-hidden>↺</span>}
      </button>
      <button ref={swatch} className="swatch" style={{ background: value }} title="Pick a colour"
        onClick={() => setPicking((p) => !p)} aria-label={`Pick ${info.name}`} />
      {picking && (
        <Popover anchor={swatch.current} onClose={() => { pushRecent(value); setPicking(false); }}>
          <ColorPicker value={value} onChange={(hex) => onChange(slot, hex)} />
        </Popover>
      )}
      <input ref={input} className={`hex ${typed ? "" : "invalid"}`} value={text} spellCheck={false} aria-label={`${info.name} hex`}
        onFocus={(e) => { e.target.select(); onSelect(slot); }}
        onChange={(e) => {
          setText(e.target.value);
          typing.current = !/^(#|0x)?[0-9a-f]{6}$/i.test(e.target.value.trim());
          if (!typing.current) onChange(slot, parseHex(e.target.value)!);
        }}
        onPaste={(e) => {
          if (onPaste(slot, e.clipboardData.getData("text"))) e.preventDefault();
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter") { e.preventDefault(); commit(); onMove(slot, 1); }
          else if (e.key === "ArrowUp") { e.preventDefault(); commit(); onMove(slot, -1); }
          else if (e.key === "Escape") { typing.current = false; setText(value); e.currentTarget.select(); }
        }} />
      <span className={`ratio ${flagged && contrast.ratio < contrast.min ? "low" : ""}`}
        title={`Contrast ${contrast.ratio.toFixed(2)}, ${contrast.against} (wants ${contrast.min})`}>
        {contrast.ratio.toFixed(1)}
      </span>
    </div>
  );
});

// Moves every colour in a group from where it stood when the panel opened, in
// OKLCH, so "less saturated" keeps each colour's lightness
function Adjust({ slots, palette, onChange, onClose }: {
  slots: Slot[];
  palette: Palette;
  onChange: (changes: Partial<Palette>, tag: string) => void;
  onClose: () => void;
}) {
  const base = useRef(Object.fromEntries(slots.map((s) => [s, palette[s]])) as Record<Slot, string>);
  const tag = useRef(`adjust-${Date.now()}`);
  const [shift, setShift] = useState<Shift>(NO_SHIFT);

  const update = (next: Shift) => {
    setShift(next);
    onChange(Object.fromEntries(slots.map((s) => [s, shiftColor(base.current[s], next)])) as Partial<Palette>, tag.current);
  };

  return (
    <div className="adjust">
      <Field label="Saturation" unit="%" value={shift.saturation} min={0} max={200} def={100} onChange={(v) => update({ ...shift, saturation: v })} />
      <Field label="Lightness" unit="" value={shift.lightness} min={-30} max={30} def={0} step={0.5} onChange={(v) => update({ ...shift, lightness: v })} />
      <Field label="Hue" unit="°" value={shift.hue} min={-180} max={180} def={0} onChange={(v) => update({ ...shift, hue: v })} />
      <div className="adjust-foot">
        <button className="link" disabled={shift === NO_SHIFT} onClick={() => update(NO_SHIFT)}>Reset</button>
        <button className="link" onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

function Field({ label, unit, value, min, max, def, step = 1, onChange }: {
  label: string; unit: string; value: number; min: number; max: number; def: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <label className="field" onDoubleClick={() => onChange(def)} title="Double-click to reset">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <span className="bar-val">{value}{unit}</span>
    </label>
  );
}
