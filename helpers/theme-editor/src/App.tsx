import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDialog, SaveDialog } from "./components/Dialogs";
import { Presets } from "./components/Presets";
import { Preview, type Tab, type View } from "./components/Preview";
import { SlotTable } from "./components/SlotTable";
import { AYU_PRESETS, type Preset } from "./lib/ayu";
import { download, listSchemes, loadLibrary, readScheme, writeScheme, type SchemeEntry } from "./lib/api";
import { findIssues } from "./lib/checks";
import { parseHex } from "./lib/color";
import { useHistory } from "./lib/history";
import {
  mergeScope, parseScheme, patchScheme, readSlots, ROW_ORDER, slugify, SLOT_INFO, SLOTS,
  type Palette, type Scheme, type Scope, type Slot,
} from "./lib/scheme";

// Where the scheme came from. No slug means it isn't in the schemes folder yet.
type Source = { slug: string | null; text: string | null; mtime: number | null };

const PREFS_KEY = "theme-editor:prefs";
type Prefs = { tab: Tab; view: View; scope: Scope };
const DEFAULT_PREFS: Prefs = { tab: "terminal", view: "both", scope: "all" };
function loadPrefs(): Prefs {
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") }; } catch { return DEFAULT_PREFS; }
}

const fromPreset = (p: Preset): Scheme => ({ name: p.name, author: p.author, description: "", variant: p.variant, palette: p.palette });
const STARTER = fromPreset(AYU_PRESETS[0]);
const asPreset = (e: SchemeEntry): Preset => ({ id: e.id, name: e.name, author: e.author, variant: e.variant, palette: e.palette, system: e.system });
const same = (a: Scheme, b: Scheme) => JSON.stringify(a) === JSON.stringify(b);

type Side = "colours" | "presets";

export default function App() {
  const history = useHistory<Scheme>(() => STARTER);
  const scheme = history.value;
  const [source, setSource] = useState<Source>({ slug: null, text: null, mtime: null });
  const [saved, setSaved] = useState<Scheme>(STARTER);
  const [old, setOld] = useState<{ label: string; palette: Palette }>({ label: "Ayu Dark", palette: STARTER.palette });
  const [mine, setMine] = useState<SchemeEntry[]>([]);
  const [library, setLibrary] = useState<Preset[] | null>(null);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const [selected, setSelected] = useState<Slot>("base00");
  const [hovered, setHovered] = useState<Slot | null>(null);
  const [trying, setTrying] = useState<Palette | null>(null); // preset under the pointer
  const [side, setSide] = useState<Side>("colours");
  const [prefs, setPrefs] = useState(loadPrefs);
  const [dialog, setDialog] = useState<"open" | "save" | null>(null);
  const [conflict, setConflict] = useState(false);
  const [status, setStatus] = useState("");
  const statusTimer = useRef(0);

  useEffect(() => { localStorage.setItem(PREFS_KEY, JSON.stringify(prefs)); }, [prefs]);

  const say = useCallback((text: string) => {
    setStatus(text);
    window.clearTimeout(statusTimer.current);
    statusTimer.current = window.setTimeout(() => setStatus(""), 6000);
  }, []);

  const dirty = !same(scheme, saved);
  const shown = useMemo(() => trying ? mergeScope(scheme.palette, trying, prefs.scope) : scheme.palette, [trying, scheme.palette, prefs.scope]);
  const issues = useMemo(() => findIssues(scheme.palette, scheme.variant), [scheme.palette, scheme.variant]);

  const refreshMine = useCallback(async () => {
    const { schemes, current } = await listSchemes();
    setMine(schemes);
    return { schemes, current };
  }, []);

  const openFile = useCallback(async (slug: string) => {
    const file = await readScheme(slug);
    const parsed = parseScheme(file.text);
    if (!parsed) throw new Error(`${slug}.yaml isn't a base16 or base24 scheme`);
    history.reset(parsed);
    setSaved(parsed);
    setSource({ slug, text: file.text, mtime: file.mtime });
    setOld({ label: `${slug}.yaml`, palette: parsed.palette });
    setDialog(null);
    say(`Opened ${slug}.yaml`);
  }, [history.reset, say]);

  useEffect(() => {
    refreshMine().then(({ schemes, current }) => {
      const pick = schemes.find((s) => s.id === current) ?? schemes[0];
      return pick ? openFile(pick.slug) : undefined;
    }).catch(() => {
      setOffline(true);
      say("The local server isn't answering, so only Open from file and Download work. Run `just app`.");
    });
    loadLibrary().then((list) => setLibrary(list.map(asPreset))).catch((e) => setLibraryError(String(e.message ?? e)));
  }, [refreshMine, openFile, say]);

  const setSlot = useCallback((slot: Slot, hex: string) => {
    history.set((s) => s.palette[slot] === hex ? s : { ...s, palette: { ...s.palette, [slot]: hex } });
  }, [history.set]);

  const setMany = useCallback((changes: Partial<Palette>, tag?: string) => {
    history.set((s) => ({ ...s, palette: { ...s.palette, ...changes } }), tag);
  }, [history.set]);

  // One hex sets the row, a list fills down from it, and text with baseXX keys
  // (a whole scheme file) sets those slots wherever it's pasted
  const pasteColours = useCallback((slot: Slot, text: string): boolean => {
    const named = readSlots(text);
    const keys = Object.keys(named);
    if (keys.length > 0) {
      setMany(named, `paste-${Date.now()}`);
      say(`Pasted ${keys.length} colours by name. Ctrl+Z undoes it.`);
      return true;
    }
    const hexes = [...text.matchAll(/(?:#|0x)[0-9a-f]{3,8}\b|\b[0-9a-f]{6}\b/gi)].map((m) => parseHex(m[0])).filter((h): h is string => !!h);
    if (hexes.length > 1) {
      const start = ROW_ORDER.indexOf(slot);
      const targets = ROW_ORDER.slice(start, start + hexes.length);
      setMany(Object.fromEntries(targets.map((s, i) => [s, hexes[i]])), `paste-${Date.now()}`);
      setSelected(targets[targets.length - 1]);
      say(`Filled ${targets.length} rows from ${SLOT_INFO[slot].name}. Ctrl+Z undoes it.`);
      return true;
    }
    const one = parseHex(text);
    if (one) { setSlot(slot, one); return true; }
    return false;
  }, [setMany, setSlot, say]);

  // Paste with no field focused goes to the selected row
  useEffect(() => {
    const paste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement).closest?.("input, textarea")) return;
      if (pasteColours(selected, e.clipboardData?.getData("text") ?? "")) e.preventDefault();
    };
    document.addEventListener("paste", paste);
    return () => document.removeEventListener("paste", paste);
  }, [selected, pasteColours]);

  const writeTo = useCallback(async (slug: string, overwrite: boolean) => {
    const text = patchScheme(source.text, scheme);
    const expected = slug === source.slug ? source.mtime : null;
    const { mtime } = await writeScheme(slug, text, expected, overwrite);
    setSource({ slug, text, mtime });
    setSaved(scheme);
    setConflict(false);
    setDialog(null);
    await refreshMine();
    say(`Saved ${slug}.yaml`);
  }, [source, scheme, refreshMine, say]);

  const save = useCallback(async () => {
    // A renamed scheme gets a new file, because tinty finds it by file name
    if (offline || !source.slug || slugify(scheme.name) !== source.slug) { setDialog("save"); return; }
    try {
      await writeTo(source.slug, false);
    } catch (e) {
      if ((e as { conflict?: boolean }).conflict) setConflict(true);
      else say(`Couldn't save: ${(e as Error).message}`);
    }
  }, [offline, source.slug, scheme.name, writeTo, say]);

  const applyPreset = useCallback((p: Preset) => {
    history.set((s) => ({
      ...s,
      palette: mergeScope(s.palette, p.palette, prefs.scope),
      variant: prefs.scope === "all" ? p.variant : s.variant,
    }), `preset-${Date.now()}`);
    setTrying(null);
    say(`Took ${prefs.scope === "all" ? "all colours" : prefs.scope === "bg" ? "backgrounds" : prefs.scope === "text" ? "text colours" : "accents"} from ${p.name}. Ctrl+Z undoes it.`);
  }, [history.set, prefs.scope, say]);

  const compare = useCallback((p: Preset) => {
    setOld({ label: p.name, palette: p.palette });
    say(`Comparing against ${p.name}`);
  }, [say]);

  const importFile = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = parseScheme(text);
    if (!parsed) { say(`${file.name} isn't a base16 or base24 scheme`); return; }
    history.reset(parsed);
    setSaved(parsed);
    setSource({ slug: null, text, mtime: null });
    setOld({ label: file.name, palette: parsed.palette });
    setDialog(null);
    say(`Opened ${file.name}. Saving puts a copy in the schemes folder.`);
  }, [history.reset, say]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const typing = (e.target as HTMLElement).closest?.("input, textarea");
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); save(); }
      else if (mod && e.key.toLowerCase() === "o") { e.preventDefault(); setDialog("open"); }
      else if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); if (e.shiftKey) history.redo(); else history.undo(); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); history.redo(); }
      else if (e.key === "Escape" && side === "presets" && !dialog) setSide("colours");
      else if (!typing && !mod && e.key === "/") { e.preventDefault(); setSide("presets"); }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [save, history.undo, history.redo, side, dialog]);

  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => { if (dirty) e.preventDefault(); };
    window.addEventListener("beforeunload", guard);
    return () => window.removeEventListener("beforeunload", guard);
  }, [dirty]);

  const fileLabel = source.slug ? `${source.slug}.yaml` : "not saved yet";
  const changedCount = SLOTS.filter((s) => scheme.palette[s] !== old.palette[s]).length;

  return (
    <div className="app">
      <header className="top">
        <div className="title">
          <input className="name" value={scheme.name} aria-label="Scheme name" spellCheck={false}
            onChange={(e) => { const name = e.target.value; history.set((s) => ({ ...s, name })); }} />
          <small>{fileLabel}{dirty && <span className="dirty"> unsaved</span>}</small>
        </div>
        <div className="seg" role="group" aria-label="Variant">
          {(["dark", "light"] as const).map((v) => (
            <button key={v} className={scheme.variant === v ? "on" : ""} onClick={() => history.set((s) => ({ ...s, variant: v }))}>
              {v[0].toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
        <span className="grow" />
        <button onClick={history.undo} disabled={!history.canUndo} title="Ctrl+Z">Undo</button>
        <button onClick={history.redo} disabled={!history.canRedo} title="Ctrl+Shift+Z">Redo</button>
        <button onClick={() => setDialog("open")} title="Ctrl+O">Open</button>
        <button onClick={() => setDialog("save")}>Save as</button>
        <button className="primary" onClick={save} disabled={!dirty && !!source.slug} title="Ctrl+S">Save</button>
      </header>

      {conflict && (
        <div className="banner">
          <span>{source.slug}.yaml changed on disk since you opened it.</span>
          <button onClick={() => writeTo(source.slug!, true).catch((e) => say(`Couldn't save: ${e.message}`))}>Overwrite it</button>
          <button onClick={() => { setConflict(false); setDialog("save"); }}>Save as a new file</button>
          <button onClick={() => setConflict(false)}>Cancel</button>
        </div>
      )}

      <main className="body">
        <aside className="side">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={side === "colours"} className={side === "colours" ? "on" : ""} onClick={() => setSide("colours")}>
              Colours{changedCount > 0 && <span className="count">{changedCount}</span>}
            </button>
            <button role="tab" aria-selected={side === "presets"} className={side === "presets" ? "on" : ""} onClick={() => setSide("presets")} title="/">
              Presets
            </button>
          </div>
          {side === "colours" ? (
            <>
              <SlotTable palette={scheme.palette} old={old.palette} oldLabel={old.label} selected={selected} hovered={hovered} issues={issues}
                onSelect={setSelected} onHover={setHovered} onChange={setSlot} onPaste={pasteColours}
                onRevertAll={(slots) => setMany(Object.fromEntries(slots.map((s) => [s, old.palette[s]])), `revert-${Date.now()}`)}
                onAdjust={setMany} />
              {issues.length > 0 && (
                <details className="checks">
                  <summary>{issues.length} {issues.length === 1 ? "thing" : "things"} to check</summary>
                  <ul>
                    {issues.map((i) => <li key={i.message}><button onClick={() => setSelected(i.slot)}>{i.message}</button></li>)}
                  </ul>
                </details>
              )}
            </>
          ) : (
            <Presets mine={mine.map(asPreset)} library={library} libraryError={libraryError} scope={prefs.scope}
              onScope={(scope) => setPrefs((p) => ({ ...p, scope }))} onHover={setTrying} onApply={applyPreset} onCompare={compare} />
          )}
        </aside>
        <Preview tab={prefs.tab} view={prefs.view} old={old.palette} oldLabel={old.label} edited={shown} trying={!!trying} highlight={hovered}
          onTab={(tab) => setPrefs((p) => ({ ...p, tab }))} onView={(view) => setPrefs((p) => ({ ...p, view }))}
          onPick={(s) => { setSide("colours"); setSelected(s); }} onHover={setHovered}
          canReset={old.palette !== saved.palette && !!source.slug} onReset={() => setOld({ label: fileLabel, palette: saved.palette })} />
      </main>

      <footer className="foot" aria-live="polite">
        <span className="foot-status">{status || "Paste a hex, a list, or a whole scheme on any row. Click anything in a preview to find its colour."}</span>
        <span className="muted">Ctrl+S save · Ctrl+Z undo · ↑↓ rows · / presets</span>
      </footer>

      {dialog === "open" && (
        <FileDialog mine={mine} current={source.slug} dirty={dirty} offline={offline} onClose={() => setDialog(null)}
          onOpen={(slug) => openFile(slug).catch((e) => say(e.message))} onImport={importFile} />
      )}
      {dialog === "save" && (
        <SaveDialog scheme={scheme} mine={mine} source={source.slug} offline={offline} onClose={() => setDialog(null)}
          onRename={(name) => history.set((s) => ({ ...s, name }))}
          onSave={(slug, overwrite) => writeTo(slug, overwrite)}
          onDownload={() => { download(`${slugify(scheme.name) || "scheme"}.yaml`, patchScheme(source.text, scheme)); say("Downloaded"); }} />
      )}
    </div>
  );
}
