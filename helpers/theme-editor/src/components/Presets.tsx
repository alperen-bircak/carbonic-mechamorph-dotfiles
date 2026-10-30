import { useEffect, useMemo, useRef, useState } from "react";
import { AYU_PRESETS, type Preset } from "../lib/ayu";
import { SCOPES, type Palette, type Scope } from "../lib/scheme";

// One background per preset instead of 24 elements; the library has 600
const STRIP: (keyof Palette)[] = ["base10", "base00", "base01", "base02", "base03", "base05", "base08", "base09", "base0A", "base0B", "base0C", "base0D", "base0E"];
const strip = (p: Palette) => {
  const w = 100 / STRIP.length;
  return `linear-gradient(90deg, ${STRIP.map((s, i) => `${p[s]} ${i * w}% ${(i + 1) * w}%`).join(",")})`;
};

type Filter = "all" | "dark" | "light";

export function Presets({ mine, library, libraryError, scope, onScope, onHover, onApply, onCompare }: {
  mine: Preset[];
  library: Preset[] | null;
  libraryError: string | null;
  scope: Scope;
  onScope: (s: Scope) => void;
  onHover: (p: Palette | null) => void;
  onApply: (p: Preset) => void;
  onCompare: (p: Preset) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [active, setActive] = useState(0);
  const list = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  useEffect(() => search.current?.focus(), []);
  useEffect(() => () => onHover(null), [onHover]);

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase();
    const keep = (p: Preset) => (filter === "all" || p.variant === filter)
      && (!q || p.name.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    return [
      { title: "Ayu", items: AYU_PRESETS.filter(keep) },
      { title: "Your schemes", items: mine.filter(keep) },
      { title: "Tinty, base24", items: (library ?? []).filter((p) => p.system === "base24").filter(keep) },
      { title: "Tinty, base16", items: (library ?? []).filter((p) => p.system === "base16").filter(keep) },
    ].filter((s) => s.items.length > 0);
  }, [query, filter, mine, library]);

  const flat = useMemo(() => sections.flatMap((s) => s.items), [sections]);
  useEffect(() => setActive(0), [query, filter]);

  const moveTo = (i: number) => {
    const n = Math.max(0, Math.min(flat.length - 1, i));
    setActive(n);
    onHover(flat[n]?.palette ?? null);
    list.current?.querySelector(`[data-index="${n}"]`)?.scrollIntoView({ block: "nearest" });
  };

  let index = -1;
  return (
    <div className="presets">
      <div className="presets-tools">
        <input ref={search} className="search" placeholder="Search presets" value={query} spellCheck={false} aria-label="Search presets"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); moveTo(active + 1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); moveTo(active - 1); }
            else if (e.key === "Enter" && flat[active]) { e.preventDefault(); onApply(flat[active]); }
            else if (e.key === "Escape" && query) { e.stopPropagation(); setQuery(""); }
          }} />
        <div className="seg" role="group" aria-label="Show">
          {(["all", "dark", "light"] as Filter[]).map((f) => (
            <button key={f} className={filter === f ? "on" : ""} onClick={() => setFilter(f)}>{f[0].toUpperCase() + f.slice(1)}</button>
          ))}
        </div>
      </div>
      <div className="presets-scope">
        <span>Take</span>
        <div className="seg" role="group" aria-label="Which colours a preset replaces">
          {SCOPES.map((s) => <button key={s.id} className={scope === s.id ? "on" : ""} onClick={() => onScope(s.id)}>{s.label}</button>)}
        </div>
      </div>
      <div className="preset-list" ref={list} onMouseLeave={() => onHover(null)}>
        {sections.map((sec) => (
          <section key={sec.title}>
            <h2>{sec.title} <span className="muted">{sec.items.length}</span></h2>
            {sec.items.map((p) => {
              index += 1;
              const i = index;
              return (
                <div key={p.id} data-index={i} className={`preset ${i === active ? "active" : ""}`}
                  onMouseEnter={() => { setActive(i); onHover(p.palette); }}>
                  <button className="preset-main" onClick={() => onApply(p)} title="Apply">
                    <span className="preset-strip" style={{ background: strip(p.palette) }} />
                    <span className="preset-name">{p.name}</span>
                    <small>{p.author || " "}</small>
                  </button>
                  <button className="link preset-compare" onClick={() => onCompare(p)} title="Use this as the Old side">Compare</button>
                </div>
              );
            })}
          </section>
        ))}
        {flat.length === 0 && <p className="empty">Nothing matches.</p>}
        {!library && !libraryError && <p className="empty">Loading the tinty library…</p>}
        {libraryError && <p className="empty">Tinty's library isn't available: {libraryError}</p>}
      </div>
    </div>
  );
}
