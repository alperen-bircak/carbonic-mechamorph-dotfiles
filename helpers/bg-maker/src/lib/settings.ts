export type Distribution = "random" | "linear" | "radial" | "noise";
export type StrokeMode = "custom" | "derived";
export type ExportFormat = "png" | "jpeg" | "webp" | "svg";

export type Settings = {
  // Canvas
  width: number;
  height: number;
  tileable: boolean;

  // Grid
  size: number; // hex circumradius in px
  gap: number; // px between neighbouring hexes
  corner: number; // corner rounding, 0–100 %
  angle: number; // tilt in degrees
  snap: number; // tilt snap step in degrees, 0 = free
  holes: number; // % of hexes left out
  seed: number;

  // Colour
  palette: string[];
  distribution: Distribution;
  gradientAngle: number;
  stepped: boolean; // hard bands instead of a smooth blend
  jitter: number; // % per-hex shuffle of the gradient position
  paletteScale: number; // feature size of the "noise" distribution, px
  background: string;
  transparentBg: boolean;

  // HSL variance
  hueVar: number; // ± degrees
  satVar: number; // ± %
  lightVar: number; // ± %
  varSmooth: number; // 0 = per-hex grain, 100 = smooth clouds
  varScale: number; // px
  varOctaves: number;

  // Border
  strokeWidth: number;
  strokeMode: StrokeMode;
  strokeColor: string;
  strokeShift: number; // lightness shift for derived borders
  strokeOpacity: number; // %
  shading: number; // bevel strength %
  lightAngle: number;

  // Export
  format: ExportFormat;
  quality: number; // jpeg/webp, %
};

export const DEFAULTS: Settings = {
  width: 2560,
  height: 1440,
  tileable: false,

  size: 56,
  gap: 4,
  corner: 18,
  angle: 0,
  snap: 15,
  holes: 0,
  seed: 1337,

  palette: ["#1f2430", "#2b3245", "#3d4760", "#5c6a8a"],
  distribution: "linear",
  gradientAngle: 135,
  stepped: false,
  jitter: 18,
  paletteScale: 700,
  background: "#14171f",
  transparentBg: false,

  hueVar: 0,
  satVar: 4,
  lightVar: 3,
  varSmooth: 35,
  varScale: 420,
  varOctaves: 3,

  strokeWidth: 0,
  strokeMode: "derived",
  strokeColor: "#ffffff",
  strokeShift: 8,
  strokeOpacity: 100,
  shading: 0,
  lightAngle: 315,

  format: "png",
  quality: 92,
};

const KEY = "bg-maker:settings:v1";

// Settings can also arrive in a share link: #s=<base64 JSON>
export function settingsFromHash(): Settings | null {
  const m = location.hash.match(/^#s=(.+)$/);
  if (!m) return null;
  try {
    const json = new TextDecoder().decode(Uint8Array.from(atob(decodeURIComponent(m[1])), (c) => c.charCodeAt(0)));
    return sanitize(JSON.parse(json));
  } catch {
    return null;
  }
}

export function shareLink(s: Settings): string {
  const bytes = new TextEncoder().encode(JSON.stringify(s));
  const b64 = btoa(String.fromCharCode(...bytes));
  return `${location.origin}${location.pathname}#s=${encodeURIComponent(b64)}`;
}

export function loadSettings(): Settings {
  const fromHash = settingsFromHash();
  if (fromHash) {
    history.replaceState(null, "", location.pathname + location.search);
    return fromHash;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return sanitize(JSON.parse(raw));
  } catch {
    // storage blocked or corrupt: fall back to defaults
  }
  return { ...DEFAULTS };
}

export function saveSettings(s: Settings) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

// Merge unknown JSON over the defaults, keeping only keys of the right type
export function sanitize(input: unknown): Settings {
  const out: Settings = { ...DEFAULTS };
  if (!input || typeof input !== "object") return out;
  const src = input as Record<string, unknown>;
  for (const k of Object.keys(DEFAULTS) as (keyof Settings)[]) {
    const v = src[k];
    if (k === "palette") {
      if (Array.isArray(v) && v.length > 0 && v.every((c) => typeof c === "string")) out.palette = v.slice(0, 12);
    } else if (typeof v === typeof DEFAULTS[k]) {
      (out as Record<string, unknown>)[k] = v;
    }
  }
  return out;
}

export const RESOLUTIONS: { label: string; w: number; h: number }[] = [
  { label: "1080p", w: 1920, h: 1080 },
  { label: "1440p", w: 2560, h: 1440 },
  { label: "4K", w: 3840, h: 2160 },
  { label: "5K", w: 5120, h: 2880 },
  { label: "Ultrawide", w: 3440, h: 1440 },
  { label: "16:10", w: 2560, h: 1600 },
  { label: "Phone", w: 1170, h: 2532 },
  { label: "Square", w: 2048, h: 2048 },
  { label: "Tile 512", w: 512, h: 512 },
];

export const PALETTES: { name: string; colors: string[] }[] = [
  { name: "Dusk", colors: ["#1f2430", "#2b3245", "#3d4760", "#5c6a8a"] },
  { name: "Paper", colors: ["#fafafa", "#f1f2f4", "#e4e7eb", "#ffe3c7"] },
  { name: "Ember", colors: ["#2d1b1b", "#6b2d2d", "#c4553a", "#f2a65a"] },
  { name: "Ocean", colors: ["#0b1d33", "#134b6e", "#1f7a8c", "#6fc2c8"] },
  { name: "Forest", colors: ["#13201a", "#24412f", "#3f6b46", "#8fb573"] },
  { name: "Sunset", colors: ["#1a1033", "#4b1d5c", "#a3346b", "#f06c5a", "#ffb36b"] },
  { name: "Nord", colors: ["#2e3440", "#3b4252", "#434c5e", "#4c566a", "#5e81ac"] },
  { name: "Gruvbox", colors: ["#282828", "#3c3836", "#665c54", "#d65d0e", "#fabd2f"] },
  { name: "Mocha", colors: ["#1e1e2e", "#313244", "#45475a", "#cba6f7", "#f5c2e7"] },
  { name: "Ayu", colors: ["#fcfcfc", "#f3f4f5", "#ffd9b3", "#ff9940", "#55b4d4"] },
  { name: "Candy", colors: ["#ffd6e0", "#ffefb5", "#c1f0dc", "#c3d9ff"] },
  { name: "Mint", colors: ["#e9f7ef", "#c8ecd9", "#94d8b9", "#4fb08d"] },
  { name: "Mono", colors: ["#111111", "#2a2a2a", "#444444", "#6a6a6a"] },
];
