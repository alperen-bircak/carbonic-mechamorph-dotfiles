import { useRef, useState } from "react";
import { hexToHsl, hslToHex } from "../lib/color";
import { HARMONIES, harmony, type Harmony } from "../lib/harmony";
import { PALETTES } from "../lib/settings";
import { ColorInput, Popover } from "./ColorInput";
import { NumberField, Segmented } from "./controls";

export function PaletteEditor({ colors, onChange }: { colors: string[]; onChange: (c: string[]) => void }) {
  const [menu, setMenu] = useState<null | "presets" | "harmony">(null);
  const presetsBtn = useRef<HTMLButtonElement>(null);
  const harmonyBtn = useRef<HTMLButtonElement>(null);

  const set = (i: number, c: string) => onChange(colors.map((x, k) => (k === i ? c : x)));
  const remove = (i: number) => onChange(colors.filter((_, k) => k !== i));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= colors.length) return;
    const next = [...colors];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  const add = () => {
    const last = hexToHsl(colors[colors.length - 1] ?? "#808080");
    onChange([...colors, hslToHex({ ...last, l: last.l > 60 ? last.l - 12 : last.l + 12 })]);
  };

  return (
    <div className="palette">
      <div className="palette-swatches">
        {colors.map((c, i) => (
          <ColorInput key={i} value={c} onChange={(v) => set(i, v)} label={`Colour ${i + 1}`}
            onRemove={colors.length > 1 ? () => remove(i) : undefined}>
            <div className="picker-row">
              <button className="btn small" disabled={i === 0} onClick={() => move(i, -1)}>← Move</button>
              <button className="btn small" disabled={i === colors.length - 1} onClick={() => move(i, 1)}>Move →</button>
            </div>
          </ColorInput>
        ))}
        {colors.length < 12 && (
          <button className="swatch md add" onClick={add} title="Add colour" aria-label="Add colour">+</button>
        )}
      </div>
      <div className="palette-actions">
        <button ref={presetsBtn} className="btn small" onClick={() => setMenu(menu === "presets" ? null : "presets")}>Presets</button>
        <button ref={harmonyBtn} className="btn small" onClick={() => setMenu(menu === "harmony" ? null : "harmony")}>Harmony</button>
        <button className="btn small" title="Reverse order" onClick={() => onChange([...colors].reverse())}>Reverse</button>
        <button className="btn small" title="Shuffle order" onClick={() => onChange([...colors].sort(() => Math.random() - 0.5))}>Shuffle</button>
      </div>

      {menu === "presets" && (
        <Popover anchor={presetsBtn.current} onClose={() => setMenu(null)}>
          <div className="preset-grid">
            {PALETTES.map((p) => (
              <button key={p.name} className="preset" onClick={() => { onChange(p.colors); setMenu(null); }}>
                <span className="strip">{p.colors.map((c) => <span key={c} style={{ background: c }} />)}</span>
                <span className="preset-name">{p.name}</span>
              </button>
            ))}
          </div>
        </Popover>
      )}
      {menu === "harmony" && (
        <Popover anchor={harmonyBtn.current} onClose={() => setMenu(null)}>
          <HarmonyMaker base={colors[0] ?? "#5c6a8a"} count={Math.max(3, colors.length)} onPick={(c) => onChange(c)} />
        </Popover>
      )}
    </div>
  );
}

function HarmonyMaker({ base: initial, count: initialCount, onPick }: {
  base: string;
  count: number;
  onPick: (c: string[]) => void;
}) {
  const [base, setBase] = useState(initial);
  const [count, setCount] = useState(initialCount);
  const [kind, setKind] = useState<Harmony>("shades");
  const preview = harmony(base, kind, count);
  return (
    <div className="harmony">
      <div className="picker-row">
        <span className="row-label">Base</span>
        <ColorInput value={base} onChange={setBase} size="sm" label="Base" />
        <span className="row-label" style={{ marginLeft: "auto" }}>Colours</span>
        <NumberField value={count} onChange={setCount} min={2} max={8} />
      </div>
      <Segmented small value={kind} onChange={setKind} options={HARMONIES.map((h) => ({ value: h.id, label: h.label }))} />
      <div className="strip big">{preview.map((c, i) => <span key={i} style={{ background: c }} />)}</div>
      <button className="btn primary" onClick={() => onPick(preview)}>Use this palette</button>
    </div>
  );
}
