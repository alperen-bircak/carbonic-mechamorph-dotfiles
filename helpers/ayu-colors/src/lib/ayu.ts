// Shared by the page and the CLI: walks the schemes exported by the `ayu`
// npm package. Nothing here is hard-coded, so a new ayu release that adds
// tokens shows up in both without changes.
import { dark, light, mirage, type Scheme } from "ayu";

/** In the same order as ayu's palette.svg */
export const themes = { light, mirage, dark } satisfies Record<string, Scheme>;
export type ThemeName = keyof typeof themes;
export const themeNames = Object.keys(themes) as ThemeName[];

export const isTheme = (name: string): name is ThemeName => name in themes;

export type Color = Scheme["editor"]["fg"];

export interface Leaf {
  path: string;
  color: Color;
}

export const isColor = (v: unknown): v is Color =>
  typeof v === "object" && v !== null && typeof (v as Color).hex === "function";

// The package lists terminal colours as black, white, brightBlack, …
const ansi = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
const ansiIndex = (key: string) => {
  const i = ansi.indexOf(key.replace(/^bright/, "").toLowerCase());
  return i < 0 ? 99 : i + (key.startsWith("bright") ? 8 : 0);
};

/** Every colour under a node, depth first in the package's key order (ANSI order for terminal) */
export function leaves(node: unknown, prefix = ""): Leaf[] {
  if (isColor(node)) return [{ path: prefix, color: node }];
  if (typeof node !== "object" || node === null) return [];
  let entries = Object.entries(node);
  if (prefix === "terminal") entries = entries.sort(([a], [b]) => ansiIndex(a) - ansiIndex(b));
  return entries.flatMap(([key, child]) => leaves(child, prefix ? `${prefix}.${key}` : key));
}

export interface Found {
  node: unknown;
  /** The path with the package's own spelling, e.g. "palette.blue.l3" */
  path: string;
}

function get(node: unknown, path: string): Found | undefined {
  const keys: string[] = [];
  for (const part of path.split(".")) {
    if (typeof node !== "object" || node === null || isColor(node)) return undefined;
    const key = Object.keys(node).find((k) => k.toLowerCase() === part.toLowerCase());
    if (key === undefined) return undefined;
    keys.push(key);
    node = (node as Record<string, unknown>)[key];
  }
  return { node, path: keys.join(".") };
}

/**
 * Looks up a dotted path, ignoring case. Palette hues can skip the
 * "palette." prefix (`blue.l3`). The node is a Color or a group.
 */
export function resolve(scheme: Scheme, path: string): Found | undefined {
  path = path.replace(/^\.+|\.+$/g, "");
  if (path === "") return { node: scheme, path: "" };
  return get(scheme, path) ?? get(scheme, `palette.${path}`);
}

const opaque = (c: Color) => c.hex().slice(0, 7);

/** Opaque hex → the non-palette tokens that use it, e.g. "#ff8f40" → ["syntax.keyword", …] */
export function usage(scheme: Scheme): Map<string, string[]> {
  const used = new Map<string, string[]>();
  for (const { path, color } of leaves(scheme)) {
    if (path.startsWith("palette.")) continue;
    const hex = opaque(color);
    used.set(hex, [...(used.get(hex) ?? []), path]);
  }
  return used;
}

/** `#rgb`, `rgb`, `#rrggbb` or `#rrggbbaa` → lower-case `#rrggbb[aa]`, or null */
export function normalizeHex(input: string): string | null {
  let hex = input.trim().replace(/^#/, "").toLowerCase();
  if (!/^([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/.test(hex)) return null;
  if (hex.length === 3) hex = [...hex].map((c) => c + c).join("");
  return `#${hex}`;
}

export function formatRgb(color: Color): string {
  const [r, g, b, a] = color.rgba();
  return a < 1 ? `rgb(${r} ${g} ${b} / ${+a.toFixed(3)})` : `rgb(${r} ${g} ${b})`;
}

/** Black or white text, whichever reads better on `color` drawn over `bg` */
export function inkFor(color: Color, bg: Color): string {
  const [r, g, b] = color.blend(bg).rgb().map((v) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  // Contrast against black vs white: (L + .05) / .05 vs 1.05 / (L + .05)
  return (lum + 0.05) ** 2 > 0.0525 ? "#000000d9" : "#ffffffe6";
}
