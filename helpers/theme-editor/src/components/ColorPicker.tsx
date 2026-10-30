import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { AYU_RAMPS, ayuToken } from "../lib/ayu";
import { hexToOklch, oklchToHex } from "../lib/color";

const RECENT_KEY = "theme-editor:recent-colors";
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
export function pushRecent(c: string) {
  const list = [c, ...loadRecent().filter((x) => x !== c)].slice(0, 12);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const lch = hexToOklch(value);
  const recent = loadRecent();
  const set = (k: "L" | "C" | "h", v: number) => onChange(oklchToHex({ ...lch, [k]: v }));
  const token = ayuToken(value);

  return (
    <div className="picker">
      <HexColorPicker color={value} onChange={onChange} />
      <div className="picker-readout">
        <span>{value}</span>
        <span className="muted">{token ?? "no ayu token"}</span>
      </div>
      <Bar label="L" title="Lightness" value={lch.L * 100} max={100} step={0.5} onChange={(v) => set("L", v / 100)}
        bg={`linear-gradient(90deg, #000, ${oklchToHex({ ...lch, L: 0.5 })}, #fff)`} />
      <Bar label="C" title="Saturation (OKLCH chroma)" value={lch.C * 100} max={37} step={0.25} onChange={(v) => set("C", v / 100)}
        bg={`linear-gradient(90deg, ${oklchToHex({ ...lch, C: 0 })}, ${oklchToHex({ ...lch, C: 0.37 })})`} />
      <Bar label="H" title="Hue" value={lch.h} max={360} step={1} onChange={(v) => set("h", v)}
        bg={`linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360].map((h) => oklchToHex({ ...lch, h, C: Math.max(lch.C, 0.08) })).join(",")})`} />
      <div className="ayu-ramps" aria-label="Ayu palette">
        {AYU_RAMPS.map((r) => r.colors.map((c) => (
          <button key={c.path} style={{ background: c.hex }} title={`${c.path} ${c.hex}`} onClick={() => onChange(c.hex)} />
        )))}
      </div>
      {recent.length > 0 && (
        <div className="recent">
          {recent.map((c) => <button key={c} style={{ background: c }} title={c} onClick={() => onChange(c)} />)}
        </div>
      )}
    </div>
  );
}

function Bar({ label, title, value, max, step, onChange, bg }: {
  label: string; title: string; value: number; max: number; step: number; onChange: (v: number) => void; bg: string;
}) {
  return (
    <label className="bar" title={title}>
      <span>{label}</span>
      <input type="range" min={0} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} style={{ background: bg }} />
      <span className="bar-val">{value.toFixed(step < 1 ? 1 : 0)}</span>
    </label>
  );
}

// Floating panel next to an element; closes on outside click or Escape
export function Popover({ anchor, onClose, children, className = "" }: {
  anchor: HTMLElement | null; onClose: () => void; children: ReactNode; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.right + 8;
    let top = a.top;
    if (left + p.width > window.innerWidth - 8) left = Math.max(8, a.left - p.width - 8);
    if (top + p.height > window.innerHeight - 8) top = Math.max(8, window.innerHeight - p.height - 8);
    setPos({ left, top });
  }, [anchor]);

  useEffect(() => {
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!anchor?.contains(t) && !ref.current?.contains(t)) close.current();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); close.current(); }
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key, true);
    return () => {
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key, true);
    };
  }, [anchor]);

  return createPortal(<div ref={ref} className={`popover ${className}`} style={pos}>{children}</div>, document.body);
}
