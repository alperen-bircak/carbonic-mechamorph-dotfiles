import { useEffect, useState, type CSSProperties, type ReactNode } from "react";

export function Section({ title, icon, children, defaultOpen = true, extra }: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  defaultOpen?: boolean;
  extra?: ReactNode;
}) {
  const key = `bg-maker:section:${title}`;
  const [open, setOpen] = useState(() => {
    try {
      const v = localStorage.getItem(key);
      return v === null ? defaultOpen : v === "1";
    } catch {
      return defaultOpen;
    }
  });
  const toggle = () => {
    setOpen((o) => {
      try { localStorage.setItem(key, o ? "0" : "1"); } catch { /* ignore */ }
      return !o;
    });
  };
  return (
    <section className={`section ${open ? "open" : ""}`}>
      <header>
        <button className="section-toggle" onClick={toggle} aria-expanded={open}>
          <span className="section-icon">{icon}</span>
          <span className="section-title">{title}</span>
          <svg className="chev" viewBox="0 0 16 16" width="14" height="14"><path d="M4 6l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        {extra && <div className="section-extra">{extra}</div>}
      </header>
      {open && <div className="section-body">{children}</div>}
    </section>
  );
}

export function Row({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div className="row">
      <span className="row-label" title={hint}>{label}</span>
      <div className="row-control">{children}</div>
    </div>
  );
}

// Slider with an editable number next to it. Double-click the label to reset.
export function Slider({ label, value, onChange, min, max, step = 1, unit = "", hint, reset, disabled }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  hint?: string;
  reset?: number;
  disabled?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={`slider ${disabled ? "disabled" : ""}`}>
      <div className="slider-head">
        <span
          className="row-label"
          title={[hint, reset !== undefined ? "Double-click to reset" : ""].filter(Boolean).join(" · ")}
          onDoubleClick={() => reset !== undefined && onChange(reset)}
        >
          {label}
        </span>
        <NumberField value={value} onChange={onChange} min={min} step={step} unit={unit} disabled={disabled} />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={Math.min(max, Math.max(min, value))}
        disabled={disabled}
        style={{ "--pct": `${Math.min(100, Math.max(0, pct))}%` } as CSSProperties}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

// Number input that only commits valid numbers (on blur / Enter), so typing isn't fought
export function NumberField({ value, onChange, min, max, step = 1, unit, disabled, wide }: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  wide?: boolean;
}) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    let n = Number(text);
    if (!Number.isFinite(n) || text.trim() === "") return setText(String(value));
    if (min !== undefined) n = Math.max(min, n);
    if (max !== undefined) n = Math.min(max, n);
    n = Math.round(n / step) * step;
    n = +n.toFixed(4);
    setText(String(n));
    if (n !== value) onChange(n);
  };
  return (
    <label className={`num ${wide ? "wide" : ""}`}>
      <input
        value={text}
        disabled={disabled}
        inputMode="decimal"
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const d = (e.key === "ArrowUp" ? 1 : -1) * step * (e.shiftKey ? 10 : 1);
            let n = value + d;
            if (min !== undefined) n = Math.max(min, n);
            if (max !== undefined) n = Math.min(max, n);
            onChange(+n.toFixed(4));
          }
        }}
      />
      {unit && <span className="unit">{unit}</span>}
    </label>
  );
}

export function Segmented<T extends string | number>({ value, onChange, options, small }: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title?: string; disabled?: boolean }[];
  small?: boolean;
}) {
  return (
    <div className={`segmented ${small ? "small" : ""}`} role="radiogroup">
      {options.map((o) => (
        <button
          key={String(o.value)}
          role="radio"
          aria-checked={o.value === value}
          className={o.value === value ? "active" : ""}
          title={o.title}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hint }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="toggle" title={hint}>
      <span className="row-label">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden />
    </label>
  );
}

export function IconButton({ onClick, title, children, active, className = "" }: {
  onClick: () => void;
  title: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <button className={`icon-btn ${active ? "active" : ""} ${className}`} onClick={onClick} title={title} aria-label={title}>
      {children}
    </button>
  );
}
