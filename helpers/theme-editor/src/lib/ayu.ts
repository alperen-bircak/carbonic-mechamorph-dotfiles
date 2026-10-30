// Built-in presets, read from the `ayu` package so they follow its releases.
// Same slot mapping as tinty/.config/tinted-theming/tinty/schemes/base24/ayu-carbon.yaml.
import { dark, light, mirage, type Scheme as AyuScheme } from "ayu";
import { flatten, midpoint, shiftColor, NO_SHIFT } from "./color";
import { GROUPS, type Palette, type Variant } from "./scheme";

export type Preset = { id: string; name: string; author: string; variant: Variant; palette: Palette; system: string };

const hex = (c: { hex: () => string }) => c.hex();

function fromAyu(t: AyuScheme, tone: { line: string; dim: string; top: string }): Palette {
  const bg = hex(t.editor.bg), fg = hex(t.editor.fg);
  return {
    base00: bg,
    base01: hex(t.ui.panel.bg),
    base02: tone.line,
    base03: hex(t.ui.fg),
    base04: tone.dim,
    base05: fg,
    base06: midpoint(fg, tone.top),
    base07: tone.top,
    base08: hex(t.terminal.red),
    base09: hex(t.syntax.keyword),
    base0A: hex(t.terminal.yellow),
    base0B: hex(t.terminal.green),
    base0C: hex(t.terminal.cyan),
    base0D: hex(t.palette.indigo.l2),
    base0E: hex(t.terminal.magenta),
    base0F: hex(t.common.error),
    base10: hex(t.ui.bg),
    base11: hex(t.surface.sunk),
    base12: hex(t.terminal.brightRed),
    base13: hex(t.terminal.brightYellow),
    base14: hex(t.terminal.brightGreen),
    base15: hex(t.terminal.brightCyan),
    base16: hex(t.terminal.brightBlue),
    base17: hex(t.terminal.brightMagenta),
  };
}

const ayuDark = fromAyu(dark, { line: hex(dark.ui.line), dim: hex(dark.palette.gray.l5), top: "#ffffff" });

// Mirage's ui.line is darker than its background and its gray ramp runs past
// the main text, so its line and dim text are derived instead
const ayuMirage = fromAyu(mirage, {
  line: flatten(hex(mirage.ui.selection.active), hex(mirage.editor.bg)),
  dim: midpoint(hex(mirage.ui.fg), hex(mirage.editor.fg)),
  top: hex(mirage.terminal.brightWhite),
});

const ayuLight = fromAyu(light, {
  line: flatten(hex(light.ui.selection.active), hex(light.editor.bg)),
  dim: midpoint(hex(light.ui.fg), hex(light.editor.fg)),
  top: midpoint(hex(light.editor.fg), "#000000"),
});

const backgrounds = GROUPS.find((g) => g.id === "bg")!.slots;

// Ayu Carbon is ayu dark with desaturated backgrounds; these are starting points for it
const carbon = (saturation: number): Palette => {
  const palette = { ...ayuDark };
  for (const s of backgrounds) palette[s] = shiftColor(ayuDark[s], { ...NO_SHIFT, saturation });
  return palette;
};

const AUTHOR = "Ayu Theme";

export const AYU_PRESETS: Preset[] = [
  { id: "ayu-dark", name: "Ayu Dark", author: AUTHOR, variant: "dark", system: "ayu", palette: ayuDark },
  { id: "carbon-50", name: "Carbon, half saturation", author: "Backgrounds at 50%", variant: "dark", system: "ayu", palette: carbon(50) },
  { id: "carbon-25", name: "Carbon, low saturation", author: "Backgrounds at 25%", variant: "dark", system: "ayu", palette: carbon(25) },
  { id: "carbon-0", name: "Carbon, neutral", author: "Backgrounds at 0%", variant: "dark", system: "ayu", palette: carbon(0) },
  { id: "ayu-mirage", name: "Ayu Mirage", author: AUTHOR, variant: "dark", system: "ayu", palette: ayuMirage },
  { id: "ayu-light", name: "Ayu Light", author: AUTHOR, variant: "light", system: "ayu", palette: ayuLight },
];

// Ramps for the picker, and every token by colour so it can name what's picked
export const AYU_RAMPS: { hue: string; colors: { path: string; hex: string }[] }[] =
  Object.entries(dark.palette).map(([hue, steps]) => ({
    hue,
    colors: Object.entries(steps as unknown as Record<string, { hex: () => string }>)
      .map(([step, c]) => ({ path: `palette.${hue}.${step}`, hex: c.hex() })),
  }));

const TOKENS = new Map<string, string>();
const walk = (node: unknown, path: string) => {
  if (typeof node !== "object" || node === null) return;
  const c = node as { hex?: () => string };
  if (typeof c.hex === "function") {
    if (!TOKENS.has(c.hex())) TOKENS.set(c.hex(), path);
    return;
  }
  for (const [k, v] of Object.entries(node)) walk(v, path ? `${path}.${k}` : k);
};
for (const k of ["ui", "editor", "surface", "common", "syntax", "terminal", "palette"] as const) walk(dark[k], k);

export const ayuToken = (hexValue: string) => TOKENS.get(hexValue);
