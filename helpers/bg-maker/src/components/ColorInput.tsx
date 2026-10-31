import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";
import { HexColorPicker } from "react-colorful";
import { hexToHsl, hslToHex, isHex, isLight, normalizeHex, parseHex } from "../lib/color";

type EyeDropperCtor = new () => { open: () => Promise<{ sRGBHex: string }> };
const EyeDropper = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;

// Recently used colours, shared by every picker
const RECENT_KEY = "bg-maker:recent-colors";
function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function pushRecent(c: string) {
  const list = [c, ...loadRecent().filter((x) => x !== c)].slice(0, 12);
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch { /* ignore */ }
}

export function ColorInput({ value, onChange, label, size = "md", children, onRemove }: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  size?: "sm" | "md";
  children?: ReactNode; // extra actions inside the popover
  onRemove?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={btn}
        className={`swatch ${size} ${open ? "open" : ""}`}
        style={{ background: value, color: isLight(value) ? "#0008" : "#fff9" }}
        onClick={() => setOpen((o) => !o)}
        title={label ? `${label}: ${value}` : value}
        aria-label={label ? `${label} colour` : "Colour"}
      />
      {open && (
        <Popover anchor={btn.current} onClose={() => { pushRecent(value); setOpen(false); }}>
          <PickerBody value={value} onChange={onChange} onRemove={onRemove && (() => { setOpen(false); onRemove(); })}>
            {children}
          </PickerBody>
        </Popover>
      )}
    </>
  );
}

function PickerBody({ value, onChange, children, onRemove }: {
  value: string;
  onChange: (v: string) => void;
  children?: ReactNode;
  onRemove?: () => void;
}) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const root = useRef<HTMLDivElement>(null);

  // Ctrl+V anywhere in the picker (outside text fields) sets the colour
  const change = useRef(onChange);
  change.current = onChange;
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest?.("input, textarea, [contenteditable]")) return;
      if (!root.current || !stack[stack.length - 1]?.contains(root.current)) return;
      const hex = parseHex(e.clipboardData?.getData("text") ?? "");
      if (hex) { e.preventDefault(); change.current(hex); }
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, []);
  const hsl = hexToHsl(value);
  const recent = loadRecent();

  const setHsl = (k: "h" | "s" | "l", v: number) => onChange(hslToHex({ ...hsl, [k]: v }));

  const commitText = () => {
    const hex = isHex(text) ? normalizeHex(text) : value;
    setText(hex);
    if (hex !== value) onChange(hex);
  };

  return (
    <div className="picker" ref={root}>
      <HexColorPicker color={value} onChange={onChange} />
      <div className="picker-row">
        <input
          className="hex-input"
          value={text}
          spellCheck={false}
          onChange={(e) => {
            setText(e.target.value);
            // Six digits are final. Three could be the start of six, so they wait for commit
            if (/^#?[0-9a-f]{6}$/i.test(e.target.value.trim())) onChange(normalizeHex(e.target.value));
          }}
          onKeyDown={(e) => { if (e.key === "Enter") commitText(); }}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => {
            // A pasted hex replaces the field instead of joining what's there
            const hex = parseHex(e.clipboardData.getData("text"));
            if (!hex) return;
            e.preventDefault();
            setText(hex);
            onChange(hex);
          }}
          onBlur={commitText}
        />
        {EyeDropper && (
          <button className="icon-btn" title="Pick a colour from the screen" onClick={async () => {
            try { onChange(normalizeHex((await new EyeDropper().open()).sRGBHex)); } catch { /* cancelled */ }
          }}>
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M19.4 4.6a2.1 2.1 0 0 0-3 0l-2.6 2.6-1.4-1.4-1.4 1.4 1.4 1.4-7.3 7.3V19h3.1l7.3-7.3 1.4 1.4 1.4-1.4-1.4-1.4 2.6-2.6a2.1 2.1 0 0 0 0-3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </button>
        )}
        <button className="icon-btn" title="Copy hex" onClick={() => navigator.clipboard?.writeText(value)}>
          <svg viewBox="0 0 24 24" width="16" height="16"><rect x="8" y="8" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="1.6" /><path d="M5 15V6a1 1 0 0 1 1-1h9" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
        {onRemove && (
          <button className="icon-btn danger" title="Remove colour" onClick={onRemove}>
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" /></svg>
          </button>
        )}
      </div>
      <div className="hsl-rows">
        <HslBar label="H" value={hsl.h} max={360} onChange={(v) => setHsl("h", v)}
          bg={`linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360].map((h) => hslToHex({ h, s: hsl.s, l: hsl.l })).join(",")})`} />
        <HslBar label="S" value={hsl.s} max={100} onChange={(v) => setHsl("s", v)}
          bg={`linear-gradient(90deg, ${hslToHex({ ...hsl, s: 0 })}, ${hslToHex({ ...hsl, s: 100 })})`} />
        <HslBar label="L" value={hsl.l} max={100} onChange={(v) => setHsl("l", v)}
          bg={`linear-gradient(90deg, #000, ${hslToHex({ ...hsl, l: 50 })}, #fff)`} />
      </div>
      {recent.length > 0 && (
        <div className="recent">
          {recent.map((c) => (
            <button key={c} className="swatch xs" style={{ background: c }} title={c} onClick={() => onChange(c)} />
          ))}
        </div>
      )}
      {children}
    </div>
  );
}

function HslBar({ label, value, max, onChange, bg }: {
  label: string;
  value: number;
  max: number;
  onChange: (v: number) => void;
  bg: string;
}) {
  return (
    <label className="hsl-bar">
      <span>{label}</span>
      <input type="range" min={0} max={max} step={1} value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))}
        style={{ background: bg }} />
      <span className="hsl-val">{Math.round(value)}</span>
    </label>
  );
}

// Open popovers, oldest first
const stack: HTMLElement[] = [];

// Floating panel anchored under an element; closes on outside click or Escape
export function Popover({ anchor, onClose, children }: {
  anchor: HTMLElement | null;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ left: -9999, top: -9999 });
  const close = useRef(onClose);
  close.current = onClose;

  useLayoutEffect(() => {
    if (!anchor || !ref.current) return;
    const a = anchor.getBoundingClientRect();
    const p = ref.current.getBoundingClientRect();
    let left = a.left;
    let top = a.bottom + 8;
    if (left + p.width > window.innerWidth - 8) left = window.innerWidth - p.width - 8;
    if (top + p.height > window.innerHeight - 8) top = Math.max(8, a.top - p.height - 8);
    setPos({ left: Math.max(8, left), top });
  }, [anchor]);

  useEffect(() => {
    const el = ref.current!;
    stack.push(el);
    // Closing removes a focused field without a blur, so blur it first to keep what was typed
    const dismiss = () => {
      const focused = document.activeElement as HTMLElement | null;
      if (focused && el.contains(focused)) flushSync(() => focused.blur());
      close.current();
    };
    // A click inside this popover or one opened on top of it keeps it open
    const down = (e: PointerEvent) => {
      const t = e.target as Node;
      if (anchor?.contains(t)) return;
      if (stack.slice(stack.indexOf(el)).some((p) => p.contains(t))) return;
      dismiss();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === el) dismiss();
    };
    document.addEventListener("pointerdown", down);
    document.addEventListener("keydown", key);
    return () => {
      stack.splice(stack.indexOf(el), 1);
      document.removeEventListener("pointerdown", down);
      document.removeEventListener("keydown", key);
    };
  }, [anchor]);

  return createPortal(
    <div ref={ref} className="popover" style={pos}>
      {children}
    </div>,
    document.body,
  );
}
