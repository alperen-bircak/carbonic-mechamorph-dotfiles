import { useEffect, useRef, useState, type ReactNode } from "react";
import type { SchemeEntry } from "../lib/api";
import { slugify, type Scheme } from "../lib/scheme";

function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    document.addEventListener("keydown", key, true);
    return () => document.removeEventListener("keydown", key, true);
  }, [onClose]);
  return (
    <div className="dialog-back" onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="dialog" role="dialog" aria-label={title}>
        <h1>{title}</h1>
        {children}
      </div>
    </div>
  );
}

export function FileDialog({ mine, current, dirty, offline, onOpen, onImport, onClose }: {
  mine: SchemeEntry[];
  current: string | null;
  dirty: boolean;
  offline: boolean;
  onOpen: (slug: string) => void;
  onImport: (file: File) => void;
  onClose: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <Dialog title="Open a scheme" onClose={onClose}>
      {dirty && <p className="warn">You have unsaved changes. Opening something else discards them.</p>}
      {offline ? <p className="muted">The local server isn't running.</p> : (
        <ul className="file-list">
          {mine.map((s) => (
            <li key={s.slug}>
              <button className={s.slug === current ? "on" : ""} onClick={() => onOpen(s.slug)}>
                <span>{s.name}</span>
                <small>{s.slug}.yaml</small>
              </button>
            </li>
          ))}
          {mine.length === 0 && <li className="muted">No schemes in the folder yet.</li>}
        </ul>
      )}
      <div className="dialog-foot">
        <input ref={input} type="file" accept=".yaml,.yml,text/yaml" hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) onImport(f); }} />
        <button onClick={() => input.current?.click()}>Open from file…</button>
        <span className="grow" />
        <button onClick={onClose}>Cancel</button>
      </div>
    </Dialog>
  );
}

export function SaveDialog({ scheme, mine, source, offline, onRename, onSave, onDownload, onClose }: {
  scheme: Scheme;
  mine: SchemeEntry[];
  source: string | null;
  offline: boolean;
  onRename: (name: string) => void;
  onSave: (slug: string, overwrite: boolean) => Promise<void>;
  onDownload: () => void;
  onClose: () => void;
}) {
  const slug = slugify(scheme.name);
  const exists = mine.some((s) => s.slug === slug) && slug !== source;
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!slug || busy) return;
    setBusy(true);
    setError("");
    try {
      await onSave(slug, exists);
    } catch (e) {
      setError((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Save as" onClose={onClose}>
      <label className="dialog-field">
        <span>Name</span>
        <input autoFocus value={scheme.name} spellCheck={false} onChange={(e) => onRename(e.target.value)} onFocus={(e) => e.target.select()}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }} />
      </label>
      <p className="muted">
        {slug ? <>Saves <code>schemes/base24/{slug}.yaml</code>, which tinty calls <code>base24-{slug}</code>.</> : "The name needs a letter or number."}
      </p>
      {exists && <p className="warn">{slug}.yaml already exists and will be replaced.</p>}
      {error && <p className="warn">{error}</p>}
      <div className="dialog-foot">
        <button onClick={onDownload}>Download instead</button>
        <span className="grow" />
        <button onClick={onClose}>Cancel</button>
        <button className="primary" disabled={!slug || busy || offline} onClick={submit}>{exists ? "Replace" : "Save"}</button>
      </div>
    </Dialog>
  );
}
