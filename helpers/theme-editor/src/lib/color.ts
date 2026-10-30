// Colour conversions. RGB channels are 0–255, HSL is h 0–360, s/l 0–100.

export type RGB = { r: number; g: number; b: number };
export type HSL = { h: number; s: number; l: number };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function hexToRgb(hex: string): RGB {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h.slice(0, 6), 16);
  if (Number.isNaN(n)) return { r: 0, g: 0, b: 0 };
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const c = (v: number) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`;
}

export function isHex(s: string): boolean {
  return /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(s.trim());
}

export function normalizeHex(s: string): string {
  return rgbToHex(hexToRgb(s));
}

// Pull a hex colour out of pasted text: "ff8800", "0xff8800", "color: #FF8800;", "#ff8800cc".
// Alpha is dropped. Bare digits only count when they are the whole text.
export function parseHex(text: string): string | null {
  const t = text.trim();
  const m = t.match(/^(?:#|0x)?([0-9a-f]{3,8})$/i) ?? t.match(/#([0-9a-f]{3,8})\b/i);
  if (!m) return null;
  const h = m[1];
  if (h.length === 3 || h.length === 6) return normalizeHex(h);
  if (h.length === 4 || h.length === 8) return normalizeHex(h.slice(0, h.length - h.length / 4));
  return null;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  h = ((h % 360) + 360) % 360;
  s = clamp(s, 0, 100) / 100;
  l = clamp(l, 0, 100) / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return { r: f(0) * 255, g: f(8) * 255, b: f(4) * 255 };
}

export const hexToHsl = (hex: string) => rgbToHsl(hexToRgb(hex));
export const hslToHex = (hsl: HSL) => rgbToHex(hslToRgb(hsl));

// OKLab, for gradients that don't go muddy in the middle
type Lab = { L: number; a: number; b: number };

const toLinear = (c: number) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const fromLinear = (c: number) =>
  255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);

function rgbToLab({ r, g, b }: RGB): Lab {
  const lr = toLinear(r), lg = toLinear(g), lb = toLinear(b);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function labToRgb({ L, a, b }: Lab): RGB {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  const lin = (v: number) => clamp(v, 0, 1);
  return {
    r: fromLinear(lin(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)),
    g: fromLinear(lin(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s)),
    b: fromLinear(lin(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)),
  };
}

export function mixOklab(a: string, b: string, t: number): string {
  const A = rgbToLab(hexToRgb(a)), B = rgbToLab(hexToRgb(b));
  return rgbToHex(labToRgb({ L: A.L + (B.L - A.L) * t, a: A.a + (B.a - A.a) * t, b: A.b + (B.b - A.b) * t }));
}

// Sample a palette as a gradient at t in [0, 1]; stepped picks the nearest band
export function samplePalette(colors: string[], t: number, stepped: boolean): string {
  if (colors.length === 0) return "#000000";
  if (colors.length === 1) return colors[0];
  t = clamp(t, 0, 1);
  if (stepped) return colors[Math.min(colors.length - 1, Math.floor(t * colors.length))];
  const x = t * (colors.length - 1);
  const i = Math.min(colors.length - 2, Math.floor(x));
  return mixOklab(colors[i], colors[i + 1], x - i);
}

// WCAG relative luminance, 0–1
export function luminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export const isLight = (hex: string) => luminance(hex) > 0.36;

// WCAG contrast ratio, 1–21
export function contrast(a: string, b: string): number {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// OKLCH: L 0–1, C 0–~0.37, h 0–360. Used for every "same lightness, less
// colour" edit, because HSL's saturation changes how light a colour looks.
export type LCH = { L: number; C: number; h: number };

export function hexToOklch(hex: string): LCH {
  const { L, a, b } = rgbToLab(hexToRgb(hex));
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { L, C: Math.hypot(a, b), h: (h + 360) % 360 };
}

const labFromLch = ({ L, C, h }: LCH): Lab => {
  const t = (h * Math.PI) / 180;
  return { L, a: C * Math.cos(t), b: C * Math.sin(t) };
};

function inGamut(lab: Lab): boolean {
  const l = (lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b) ** 3;
  const m = (lab.L - 0.1055613458 * lab.a - 0.0638541728 * lab.b) ** 3;
  const s = (lab.L - 0.0894841775 * lab.a - 1.291485548 * lab.b) ** 3;
  const e = 0.0005;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].every((v) => v >= -e && v <= 1 + e);
}

// Out-of-gamut colours keep their lightness and hue and lose chroma
export function oklchToHex(lch: LCH): string {
  const c = { ...lch, L: clamp(lch.L, 0, 1), C: Math.max(0, lch.C) };
  if (!inGamut(labFromLch(c))) {
    let lo = 0, hi = c.C;
    for (let i = 0; i < 16; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(labFromLch({ ...c, C: mid }))) lo = mid; else hi = mid;
    }
    c.C = lo;
  }
  return rgbToHex(labToRgb(labFromLch(c)));
}

export type Shift = { saturation: number; lightness: number; hue: number };
export const NO_SHIFT: Shift = { saturation: 100, lightness: 0, hue: 0 };

// saturation is a percentage of the chroma, lightness and hue are offsets
export function shiftColor(hex: string, { saturation, lightness, hue }: Shift): string {
  if (saturation === 100 && lightness === 0 && hue === 0) return hex;
  const { L, C, h } = hexToOklch(hex);
  return oklchToHex({ L: L + lightness / 100, C: (C * saturation) / 100, h: h + hue });
}

// Flatten "#rrggbbaa" onto a background; six-digit colours pass through
export function flatten(hex: string, bg: string): string {
  const h = hex.replace("#", "");
  if (h.length !== 8) return normalizeHex(hex);
  const a = parseInt(h.slice(6), 16) / 255;
  const f = hexToRgb(h.slice(0, 6)), b = hexToRgb(bg);
  return rgbToHex({ r: f.r * a + b.r * (1 - a), g: f.g * a + b.g * (1 - a), b: f.b * a + b.b * (1 - a) });
}

// Plain RGB midpoint
export function midpoint(a: string, b: string): string {
  const x = hexToRgb(a), y = hexToRgb(b);
  return rgbToHex({ r: (x.r + y.r) / 2, g: (x.g + y.g) / 2, b: (x.b + y.b) / 2 });
}
