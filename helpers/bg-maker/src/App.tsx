import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AngleDial } from "./components/AngleDial";
import { ColorInput } from "./components/ColorInput";
import { IconButton, NumberField, Row, Section, Segmented, Slider, Toggle } from "./components/controls";
import * as I from "./components/icons";
import { Looks } from "./components/Looks";
import { PaletteEditor } from "./components/PaletteEditor";
import { Preview, type ViewMode } from "./components/Preview";
import { HARMONIES, harmony, randomColor } from "./lib/harmony";
import { buildGrid, effectiveAngle } from "./lib/hexgrid";
import { useHistory } from "./lib/history";
import { applyLook } from "./lib/looks";
import { buildSvg, download, exportImage, formatBytes, svgBlob } from "./lib/render";
import {
  DEFAULTS, PALETTES, RESOLUTIONS, loadSettings, sanitize, saveSettings, shareLink,
  type Distribution, type ExportFormat, type Settings,
} from "./lib/settings";

const MAX_SIDE = 16384; // browsers refuse bigger canvases

const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];
const rand = (lo: number, hi: number, step = 1) => Math.round((lo + Math.random() * (hi - lo)) / step) * step;
const newSeed = () => Math.floor(Math.random() * 100000);

// Random but tasteful settings; keeps the canvas size and seamless mode
function surprise(s: Settings): Settings {
  const palette = Math.random() < 0.5
    ? pick(PALETTES).colors
    : harmony(randomColor(), pick(HARMONIES).id, rand(3, 5));
  const distribution = pick<Distribution>(["random", "linear", "linear", "radial", "noise", "noise"]);
  return {
    ...s,
    seed: newSeed(),
    palette,
    distribution,
    gradientAngle: rand(0, 345, 15),
    stepped: Math.random() < 0.2,
    jitter: rand(0, 40),
    paletteScale: rand(300, 1400, 50),
    size: rand(18, 110),
    gap: Math.random() < 0.3 ? 0 : rand(1, 8),
    corner: Math.random() < 0.4 ? 0 : rand(8, 45),
    angle: pick([0, 0, 15, 30, 45]),
    holes: Math.random() < 0.15 ? rand(5, 35) : 0,
    hueVar: Math.random() < 0.3 ? rand(2, 12) : 0,
    satVar: rand(0, 10),
    lightVar: rand(1, 9),
    varSmooth: rand(0, 100, 5),
    varScale: rand(150, 900, 25),
    strokeWidth: Math.random() < 0.3 ? rand(1, 4, 0.5) : 0,
    strokeShift: pick([-10, -6, 6, 10]),
    shading: Math.random() < 0.25 ? rand(15, 60) : 0,
  };
}

export default function App() {
  const history = useHistory<Settings>(loadSettings);
  const s = history.value;
  const setS = history.set;
  const update = useCallback(<K extends keyof Settings>(k: K, v: Settings[K]) => setS((p) => ({ ...p, [k]: v })), [setS]);

  useEffect(() => saveSettings(s), [s]);

  // Heavy work runs on a deferred copy so sliders stay smooth
  const deferred = useDeferredValue(s);
  const grid = useMemo(() => buildGrid(deferred), [deferred]);
  const svg = useMemo(() => buildSvg(deferred, grid), [deferred, grid]);
  const [url, setUrl] = useState("");
  useEffect(() => {
    const u = URL.createObjectURL(svgBlob(svg));
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [svg]);

  const [view, setView] = useState<ViewMode>("fit");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef(0);
  const flash = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2400);
  };

  const doExport = async () => {
    setBusy(true);
    try {
      const { blob, name } = await exportImage(buildSvg(s), s);
      download(blob, name);
      flash(`Saved ${name} · ${formatBytes(blob.size)}`);
    } catch (e) {
      flash(`Export failed: ${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const copySvg = async () => {
    try {
      await navigator.clipboard.writeText(buildSvg(s));
      flash("SVG copied to clipboard");
    } catch {
      flash("Clipboard not available");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink(s));
      flash("Link with these settings copied");
    } catch {
      flash("Clipboard not available");
    }
  };

  const fileInput = useRef<HTMLInputElement>(null);
  const savePreset = () => {
    download(new Blob([JSON.stringify(s, null, 2)], { type: "application/json" }), `hex-preset-${s.seed}.json`);
  };
  const loadPreset = async (file: File) => {
    try {
      setS(sanitize(JSON.parse(await file.text())));
      flash(`Loaded ${file.name}`);
    } catch {
      flash("That file isn't a preset");
    }
  };

  // Keyboard: Ctrl+Z / Ctrl+Shift+Z undo/redo, Ctrl+S export, R reseed
  const exportRef = useRef(doExport);
  exportRef.current = doExport;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement).matches?.("input:not([type=range]):not([type=checkbox]), textarea");
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === "s") { e.preventDefault(); exportRef.current(); return; }
      if (typing) return;
      if (mod && e.key.toLowerCase() === "z") { e.preventDefault(); e.shiftKey ? history.redo() : history.undo(); }
      else if (mod && e.key.toLowerCase() === "y") { e.preventDefault(); history.redo(); }
      else if (!mod && !e.altKey && e.key.toLowerCase() === "r") setS((p) => ({ ...p, seed: newSeed() }));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [history.undo, history.redo, setS]);

  const angleShown = effectiveAngle(s);
  const gradientInTile = s.tileable && (s.distribution === "linear" || s.distribution === "radial");
  const resLabel = RESOLUTIONS.find((r) => r.w === s.width && r.h === s.height)?.label;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden>
            <path d="M16 2 28.1 9v14L16 30 3.9 23V9z" fill="var(--accent)" />
            <path d="M16 9.5 21.6 12.75v6.5L16 22.5l-5.6-3.25v-6.5z" fill="var(--panel)" opacity=".9" />
          </svg>
          <div>
            <h1>Hex Background Maker</h1>
            <p>Tiling hexagon wallpapers</p>
          </div>
        </div>

        <div className="toolbar">
          <button className="btn accent" onClick={() => setS(surprise)} title="Random palette and settings">
            <I.IconSpark /> Surprise me
          </button>
          <IconButton title="Undo (Ctrl+Z)" onClick={history.undo} className={history.canUndo ? "" : "dim"}><I.IconUndo /></IconButton>
          <IconButton title="Redo (Ctrl+Shift+Z)" onClick={history.redo} className={history.canRedo ? "" : "dim"}><I.IconRedo /></IconButton>
          <IconButton title="Reset everything to defaults" onClick={() => setS({ ...DEFAULTS })}><I.IconReset /></IconButton>
          <IconButton title="Save settings as a preset file" onClick={savePreset}><I.IconSave /></IconButton>
          <IconButton title="Load a preset file" onClick={() => fileInput.current?.click()}><I.IconOpen /></IconButton>
          <IconButton title="Copy a link with these settings" onClick={copyLink}><I.IconLink /></IconButton>
          <input ref={fileInput} type="file" accept="application/json,.json" hidden onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadPreset(f);
            e.target.value = "";
          }} />
        </div>

        <div className="sections">
          <Section title="Looks" icon={<I.IconSpark />}>
            <Looks onPick={(l) => { setS((p) => applyLook(p, l)); flash(`Applied “${l.name}”`); }} />
          </Section>

          <Section title="Canvas" icon={<I.IconCanvas />}>
            <div className="chips">
              {RESOLUTIONS.map((r) => (
                <button key={r.label} className={`chip ${r.w === s.width && r.h === s.height ? "active" : ""}`}
                  onClick={() => setS((p) => ({ ...p, width: r.w, height: r.h }))} title={`${r.w} × ${r.h}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className="res-row">
              <NumberField value={s.width} onChange={(v) => update("width", v)} min={16} max={MAX_SIDE} unit="w" wide />
              <span className="times">×</span>
              <NumberField value={s.height} onChange={(v) => update("height", v)} min={16} max={MAX_SIDE} unit="h" wide />
              <IconButton title="Swap width and height" onClick={() => setS((p) => ({ ...p, width: p.height, height: p.width }))}><I.IconSwap /></IconButton>
              <IconButton title="Use this screen's resolution" onClick={() => {
                const d = window.devicePixelRatio || 1;
                setS((p) => ({ ...p, width: Math.round(screen.width * d), height: Math.round(screen.height * d) }));
              }}><I.IconScreen /></IconButton>
            </div>
            <Toggle label="Seamless tile" checked={s.tileable} onChange={(v) => update("tileable", v)}
              hint="Edges wrap around so the image repeats without seams" />
            {grid.tile && (
              <p className="note">
                Repeats every {grid.tile.cols} × {grid.tile.rows} lattice periods. To land exactly on the edges, hexes
                are {(s.size * Math.sqrt(grid.tile.stretchX * grid.tile.stretchY)).toFixed(1)} px and
                {" "}{fmtStretch(grid.tile.stretchX / grid.tile.stretchY)}.
              </p>
            )}
          </Section>

          <Section title="Grid" icon={<I.IconGrid />}>
            <Slider label="Hex size" value={s.size} onChange={(v) => update("size", v)} min={4} max={320} unit="px" reset={DEFAULTS.size}
              hint="Distance from the centre to a corner" />
            <Slider label="Gap" value={s.gap} onChange={(v) => update("gap", v)} min={0} max={60} step={0.5} unit="px" reset={DEFAULTS.gap} />
            <Slider label="Round corners" value={s.corner} onChange={(v) => update("corner", v)} min={0} max={100} unit="%" reset={DEFAULTS.corner} />
            <Slider label="Holes" value={s.holes} onChange={(v) => update("holes", v)} min={0} max={95} unit="%" reset={0}
              hint="Leave out a random share of the hexes" />
            <div className="tilt">
              <AngleDial value={angleShown} onChange={(v) => update("angle", v)} snap={s.tileable ? 30 : s.snap} />
              <div className="tilt-side">
                <div className="slider-head">
                  <span className="row-label">Tilt</span>
                  <NumberField value={angleShown} onChange={(v) => update("angle", ((v % 360) + 360) % 360)} step={s.tileable ? 30 : 0.5} unit="°" disabled={s.tileable} />
                </div>
                <Segmented small value={s.tileable ? 30 : s.snap} onChange={(v) => update("snap", v)}
                  options={[0, 5, 15, 30].map((v) => ({ value: v, label: v === 0 ? "Free" : `${v}°`, disabled: s.tileable }))} />
                <div className="chips">
                  {[0, 15, 30, 45].map((a) => (
                    <button key={a} className={`chip ${angleShown === a ? "active" : ""}`} onClick={() => update("angle", a)}
                      disabled={s.tileable && a % 30 !== 0}>{a}°</button>
                  ))}
                </div>
              </div>
            </div>
            {s.tileable && <p className="note">Seamless tiles only work along the grid's own axes, so tilt is 0° (pointy) or 30° (flat).</p>}
          </Section>

          <Section title="Colours" icon={<I.IconPalette />}>
            <PaletteEditor colors={s.palette} onChange={(c) => update("palette", c)} />
            <Row label="Spread">
              <Segmented value={s.distribution} onChange={(v) => update("distribution", v)} options={[
                { value: "random", label: "Random", title: "Each hex picks a palette colour" },
                { value: "linear", label: "Linear", title: "Gradient across the canvas" },
                { value: "radial", label: "Radial", title: "Gradient from the centre" },
                { value: "noise", label: "Noise", title: "Smooth blobs of palette colours" },
              ]} />
            </Row>
            {s.distribution === "linear" && (
              <div className="tilt">
                <AngleDial value={s.gradientAngle} onChange={(v) => update("gradientAngle", v)} snap={15} size={72} hexagon={false} />
                <div className="tilt-side">
                  <div className="slider-head">
                    <span className="row-label">Direction</span>
                    <NumberField value={s.gradientAngle} onChange={(v) => update("gradientAngle", ((v % 360) + 360) % 360)} unit="°" />
                  </div>
                  <p className="note tight">Needle points towards the last colour.</p>
                </div>
              </div>
            )}
            {s.distribution === "noise" && (
              <Slider label="Blob size" value={s.paletteScale} onChange={(v) => update("paletteScale", v)} min={60} max={3000} step={10} unit="px" reset={DEFAULTS.paletteScale} />
            )}
            {s.distribution !== "random" && (
              <>
                <Slider label="Jitter" value={s.jitter} onChange={(v) => update("jitter", v)} min={0} max={100} unit="%" reset={DEFAULTS.jitter}
                  hint="Shuffle each hex's place along the gradient, for a ragged blend" />
                <Toggle label="Hard bands" checked={s.stepped} onChange={(v) => update("stepped", v)} hint="Use the palette colours as-is instead of blending" />
              </>
            )}
            {gradientInTile && <p className="note warn">Gradients don't wrap around, so this won't tile cleanly. Random or Noise will.</p>}
            <Row label="Background">
              <div className="inline">
                <ColorInput value={s.background} onChange={(v) => update("background", v)} label="Background" size="sm" />
                <Toggle label="Transparent" checked={s.transparentBg} onChange={(v) => update("transparentBg", v)} hint="Shows through gaps and holes. JPEG always fills it." />
              </div>
            </Row>
          </Section>

          <Section title="Variance" icon={<I.IconNoise />} extra={
            <span className="seed">
              <NumberField value={s.seed} onChange={(v) => update("seed", v)} min={0} />
              <IconButton title="New seed (R)" onClick={() => update("seed", newSeed())}><I.IconDice /></IconButton>
            </span>
          }>
            <Slider label="Hue ±" value={s.hueVar} onChange={(v) => update("hueVar", v)} min={0} max={180} unit="°" reset={0} />
            <Slider label="Saturation ±" value={s.satVar} onChange={(v) => update("satVar", v)} min={0} max={60} step={0.5} unit="%" reset={0} />
            <Slider label="Lightness ±" value={s.lightVar} onChange={(v) => update("lightVar", v)} min={0} max={50} step={0.5} unit="%" reset={0} />
            <Slider label="Grain → Clouds" value={s.varSmooth} onChange={(v) => update("varSmooth", v)} min={0} max={100} unit="%" reset={DEFAULTS.varSmooth}
              hint="0 % = every hex is random, 100 % = smooth noise across the canvas" />
            <Slider label="Cloud size" value={s.varScale} onChange={(v) => update("varScale", v)} min={40} max={3000} step={10} unit="px" reset={DEFAULTS.varScale}
              disabled={s.varSmooth === 0} />
            <Slider label="Cloud detail" value={s.varOctaves} onChange={(v) => update("varOctaves", v)} min={1} max={6} reset={DEFAULTS.varOctaves}
              disabled={s.varSmooth === 0} hint="Noise octaves" />
          </Section>

          <Section title="Border & shading" icon={<I.IconBorder />}>
            <Slider label="Border width" value={s.strokeWidth} onChange={(v) => update("strokeWidth", v)} min={0} max={24} step={0.25} unit="px" reset={0} />
            {s.strokeWidth > 0 && (
              <>
                <Row label="Colour">
                  <div className="inline">
                    <Segmented small value={s.strokeMode} onChange={(v) => update("strokeMode", v)} options={[
                      { value: "derived", label: "From fill" },
                      { value: "custom", label: "Custom" },
                    ]} />
                    {s.strokeMode === "custom" && <ColorInput value={s.strokeColor} onChange={(v) => update("strokeColor", v)} label="Border" size="sm" />}
                  </div>
                </Row>
                {s.strokeMode === "derived" && (
                  <Slider label="Lighter / darker" value={s.strokeShift} onChange={(v) => update("strokeShift", v)} min={-50} max={50} unit="%" reset={DEFAULTS.strokeShift}
                    hint="Each border is its hex's colour with this lightness shift" />
                )}
                <Slider label="Border opacity" value={s.strokeOpacity} onChange={(v) => update("strokeOpacity", v)} min={0} max={100} unit="%" reset={100} />
              </>
            )}
            <Slider label="Bevel" value={s.shading} onChange={(v) => update("shading", v)} min={0} max={100} unit="%" reset={0}
              hint="Light and shadow across each hex" />
            {s.shading > 0 && (
              <div className="tilt">
                <AngleDial value={s.lightAngle} onChange={(v) => update("lightAngle", v)} snap={15} size={72} hexagon={false} />
                <div className="tilt-side">
                  <div className="slider-head">
                    <span className="row-label">Light from</span>
                    <NumberField value={s.lightAngle} onChange={(v) => update("lightAngle", ((v % 360) + 360) % 360)} unit="°" />
                  </div>
                </div>
              </div>
            )}
          </Section>
        </div>

        <div className="export">
          <Segmented value={s.format} onChange={(v: ExportFormat) => update("format", v)} options={[
            { value: "png", label: "PNG" },
            { value: "jpeg", label: "JPEG" },
            { value: "webp", label: "WebP" },
            { value: "svg", label: "SVG" },
          ]} />
          {(s.format === "jpeg" || s.format === "webp") && (
            <Slider label="Quality" value={s.quality} onChange={(v) => update("quality", v)} min={40} max={100} unit="%" reset={92} />
          )}
          <div className="export-row">
            <button className="btn primary big" onClick={doExport} disabled={busy}>
              <I.IconExport /> {busy ? "Rendering…" : `Download ${s.format === "jpeg" ? "JPEG" : s.format.toUpperCase()}`}
            </button>
            <IconButton title="Copy SVG markup" onClick={copySvg}><I.IconCopy /></IconButton>
          </div>
          <p className="export-meta">
            {s.width} × {s.height}{resLabel ? ` · ${resLabel}` : ""} · {grid.cells.length.toLocaleString()} hexes · SVG {formatBytes(svg.length)}
          </p>
        </div>
      </aside>

      <main className="stage">
        <div className="stage-bar">
          <Segmented small value={view} onChange={setView} options={[
            { value: "fit", label: <><I.IconFit /> Fit</>, title: "Fit to window" },
            { value: "actual", label: <><I.IconActual /> 1:1</>, title: "Actual pixels" },
            { value: "tiled", label: <><I.IconTiles /> Tiled</>, title: "Repeat 3 × 3 to check the seams" },
          ]} />
          <span className="stage-hint">R new seed · Ctrl+Z undo · Ctrl+S export</span>
        </div>
        <Preview url={url} width={s.width} height={s.height} view={view} transparent={s.transparentBg} stale={deferred !== s} />
        {toast && <div className="toast">{toast}</div>}
      </main>
    </div>
  );
}

const fmtStretch = (f: number) => {
  const p = (f - 1) * 100;
  if (Math.abs(p) < 0.05) return "perfectly regular";
  return `${Math.abs(p).toFixed(1)} % ${p > 0 ? "wider" : "narrower"} than regular`;
};
