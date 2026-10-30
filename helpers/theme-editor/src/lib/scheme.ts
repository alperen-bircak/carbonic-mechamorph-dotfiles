// Base24 schemes: the slots, what each is for, and reading and writing the YAML.
// Used by the page and by server/api.ts, so nothing here touches the DOM.
import { luminance, normalizeHex } from "./color";

export const SLOTS = [
  "base00", "base01", "base02", "base03", "base04", "base05", "base06", "base07",
  "base08", "base09", "base0A", "base0B", "base0C", "base0D", "base0E", "base0F",
  "base10", "base11", "base12", "base13", "base14", "base15", "base16", "base17",
] as const;

export type Slot = (typeof SLOTS)[number];
export type Palette = Record<Slot, string>;
export type Variant = "dark" | "light";
export type Scheme = { name: string; author: string; description: string; variant: Variant; palette: Palette };

// What a base16 scheme uses in place of the extra base24 slots (base24 styling guide)
const FALLBACK: Partial<Record<Slot, Slot>> = {
  base10: "base00", base11: "base00", base12: "base08", base13: "base0A",
  base14: "base0B", base15: "base0C", base16: "base0D", base17: "base0E",
};

// Names follow THEME_MANIFEST.md where it gives a slot a role, else the base24 guide
export const SLOT_INFO: Record<Slot, { name: string; hint: string }> = {
  base11: { name: "Deepest background", hint: "Rarely used" },
  base10: { name: "Darkest background", hint: "Bars, outer areas" },
  base00: { name: "Main background", hint: "Windows, editors, terminal" },
  base01: { name: "Raised background", hint: "Panels, popups, the lock box" },
  base02: { name: "Lines and selection", hint: "Thin borders, selected items" },
  base03: { name: "Muted text", hint: "Comments, inactive items" },
  base04: { name: "Dim text", hint: "Status bars, menu items" },
  base05: { name: "Main text", hint: "Default text, cursor" },
  base06: { name: "Light text", hint: "Search matches, rarely used" },
  base07: { name: "Brightest text", hint: "Terminal bright white" },
  base08: { name: "Red", hint: "Variables, diff deleted" },
  base09: { name: "Orange", hint: "Numbers, constants, attributes" },
  base0A: { name: "Yellow", hint: "Types, search" },
  base0B: { name: "Green", hint: "Strings, diff inserted" },
  base0C: { name: "Cyan", hint: "Regex, escapes" },
  base0D: { name: "Accent", hint: "Active item, functions" },
  base0E: { name: "Magenta", hint: "Keywords, diff changed" },
  base0F: { name: "Errors", hint: "Error text, deprecated code" },
  base12: { name: "Bright red", hint: "Terminal bright red" },
  base13: { name: "Bright yellow", hint: "Terminal bright yellow" },
  base14: { name: "Bright green", hint: "Terminal bright green" },
  base15: { name: "Bright cyan", hint: "Terminal bright cyan" },
  base16: { name: "Bright blue", hint: "Terminal bright blue" },
  base17: { name: "Bright magenta", hint: "Terminal bright magenta" },
};

export const GROUPS: { id: string; title: string; slots: Slot[] }[] = [
  { id: "bg", title: "Backgrounds", slots: ["base11", "base10", "base00", "base01", "base02"] },
  { id: "text", title: "Text", slots: ["base03", "base04", "base05", "base06", "base07"] },
  { id: "accents", title: "Accents", slots: ["base08", "base09", "base0A", "base0B", "base0C", "base0D", "base0E", "base0F"] },
  { id: "bright", title: "Bright accents", slots: ["base12", "base13", "base14", "base15", "base16", "base17"] },
];

// Table order, which is what "fill down" follows when pasting a list of colours
export const ROW_ORDER: Slot[] = GROUPS.flatMap((g) => g.slots);

export type Scope = "all" | "bg" | "text" | "accents";
export const SCOPES: { id: Scope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "bg", label: "Backgrounds" },
  { id: "text", label: "Text" },
  { id: "accents", label: "Accents" },
];

const scopeSlots = (scope: Scope): readonly Slot[] => {
  if (scope === "all") return SLOTS;
  if (scope === "accents") return GROUPS.filter((g) => g.id === "accents" || g.id === "bright").flatMap((g) => g.slots);
  return GROUPS.find((g) => g.id === scope)!.slots;
};

export function mergeScope(current: Palette, from: Palette, scope: Scope): Palette {
  const next = { ...current };
  for (const s of scopeSlots(scope)) next[s] = from[s];
  return next;
}

const SLOT_BY_LOWER = new Map(SLOTS.map((s) => [s.toLowerCase(), s]));

const unquote = (raw: string) => {
  const v = raw.trim();
  const dq = v.match(/^"((?:[^"\\]|\\.)*)"/);
  if (dq) {
    try { return JSON.parse(`"${dq[1]}"`) as string; } catch { return dq[1]; }
  }
  const sq = v.match(/^'((?:[^']|'')*)'/);
  if (sq) return sq[1].replace(/''/g, "'");
  return v.replace(/(^|\s+)#.*$/, "").trim();
};

const asHex = (raw: string) => {
  const h = unquote(raw).replace(/^0x/i, "").replace(/^#/, "");
  if (/^[0-9a-f]{8}$/i.test(h)) return normalizeHex(h.slice(0, 6));
  return /^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(h) ? normalizeHex(h) : null;
};

const KEY_LINE = /^(\s*)([A-Za-z0-9_-]+)\s*:\s*(.*)$/;

// Just the baseXX keys found in some text, nested under `palette:` or flat
export function readSlots(text: string): Partial<Palette> {
  const found: Partial<Palette> = {};
  for (const line of text.split("\n")) {
    const m = line.match(KEY_LINE);
    const slot = m && SLOT_BY_LOWER.get(m[2].toLowerCase());
    const hex = m && asHex(m[3]);
    if (slot && hex) found[slot] = hex;
  }
  return found;
}

// Accepts base16 too, filling the extra slots with their fallbacks. Null if the
// text doesn't have at least base00–base0F.
export function parseScheme(text: string): Scheme | null {
  const found = readSlots(text);
  if (SLOTS.slice(0, 16).some((s) => !found[s])) return null;
  const palette = {} as Palette;
  for (const s of SLOTS) palette[s] = found[s] ?? found[FALLBACK[s]!]!;

  const top: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const m = line.match(KEY_LINE);
    if (m && m[1] === "" && !(m[2] in top)) top[m[2]] = unquote(m[3]);
  }
  const variant = top.variant === "light" || top.variant === "dark"
    ? top.variant
    : luminance(palette.base00) > 0.36 ? "light" : "dark";
  return {
    name: top.name || top.scheme || "Untitled",
    author: top.author ?? "",
    description: top.description ?? "",
    variant,
    palette,
  };
}

export const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const VALUE = `("(?:[^"\\\\]|\\\\.)*"|'(?:[^']|'')*'|[^\\s#]+)`;

// Writes colours and details into the original text, so comments, order and
// spacing survive and a save only changes what changed. Falls back to a fresh
// file when there's no original or it's missing slots (a base16 file).
export function patchScheme(original: string | null, scheme: Scheme): string {
  if (!original || SLOTS.some((s) => !readSlots(original)[s])) return renderScheme(scheme);
  const details: Record<string, string> = {
    system: "base24", name: scheme.name, author: scheme.author, variant: scheme.variant,
  };
  if (scheme.description) details.description = scheme.description;
  const seen = new Set<string>();
  const slotLine = new RegExp(`^(\\s*)(base[0-9a-fA-F]{2})(\\s*:\\s*)${VALUE}(.*)$`);
  const topLine = new RegExp(`^([a-z]+)(\\s*:\\s*)${VALUE}?(.*)$`);
  const lines = original.split("\n").map((line) => {
    const slot = line.match(slotLine);
    if (slot) {
      const key = SLOT_BY_LOWER.get(slot[2].toLowerCase());
      if (key) return `${slot[1]}${slot[2]}${slot[3]}"${scheme.palette[key]}"${slot[5]}`;
    }
    const top = line.match(topLine);
    if (top && top[1] in details) {
      seen.add(top[1]);
      return `${top[1]}${top[2]}${JSON.stringify(details[top[1]])}${top[4]}`;
    }
    return line;
  });
  const missing = Object.keys(details).filter((k) => !seen.has(k)).map((k) => `${k}: ${JSON.stringify(details[k])}`);
  const at = lines.findIndex((l) => /^palette\s*:/.test(l));
  lines.splice(at < 0 ? 0 : at, 0, ...missing);
  return lines.join("\n");
}

export function renderScheme(scheme: Scheme): string {
  const lines = ["system: \"base24\"", `name: ${JSON.stringify(scheme.name)}`, `author: ${JSON.stringify(scheme.author)}`];
  if (scheme.description) lines.push(`description: ${JSON.stringify(scheme.description)}`);
  lines.push(`variant: ${JSON.stringify(scheme.variant)}`, "palette:");
  for (const s of SLOTS) lines.push(`  ${s}: "${scheme.palette[s]}" # ${SLOT_INFO[s].name}`);
  return lines.join("\n") + "\n";
}
