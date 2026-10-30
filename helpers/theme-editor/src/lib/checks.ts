// Things worth fixing in a palette: contrast too low to read, and the ramps the
// base24 styling guide expects.
import { contrast, hexToOklch, luminance } from "./color";
import { SLOT_INFO, type Palette, type Slot, type Variant } from "./scheme";

export type Issue = { slot: Slot; message: string };

const TEXT_MIN: Partial<Record<Slot, number>> = { base03: 3, base04: 4.5, base05: 4.5, base06: 4.5, base07: 4.5 };
const ACCENT_MIN = 3;
const BRIGHT: [Slot, Slot][] = [
  ["base12", "base08"], ["base13", "base0A"], ["base14", "base0B"],
  ["base15", "base0C"], ["base16", "base0D"], ["base17", "base0E"],
];

// The figure shown on each row: text against the main background, or for a
// background, the main text on top of it
export function rowContrast(slot: Slot, p: Palette): { ratio: number; min: number; against: string } {
  if (["base11", "base10", "base00", "base01", "base02"].includes(slot)) {
    return { ratio: contrast(p.base05, p[slot]), min: 4.5, against: "main text on this background" };
  }
  return { ratio: contrast(p[slot], p.base00), min: TEXT_MIN[slot] ?? ACCENT_MIN, against: "against the main background" };
}

export function findIssues(p: Palette, variant: Variant): Issue[] {
  const issues: Issue[] = [];
  const name = (s: Slot) => SLOT_INFO[s].name;

  for (const slot of Object.keys(p) as Slot[]) {
    const { ratio, min, against } = rowContrast(slot, p);
    if (ratio < min) issues.push({ slot, message: `${name(slot)}: contrast ${ratio.toFixed(1)}, ${against} needs ${min}` });
  }

  const ramp: Slot[] = ["base00", "base01", "base02", "base03", "base04", "base05", "base06", "base07"];
  const sign = variant === "dark" ? 1 : -1;
  ramp.slice(1).forEach((slot, i) => {
    const prev = ramp[i];
    if (sign * (luminance(p[slot]) - luminance(p[prev])) < 0) {
      issues.push({ slot, message: `${name(slot)} should be ${variant === "dark" ? "lighter" : "darker"} than ${name(prev).toLowerCase()}` });
    }
  });

  if (variant === "dark") {
    if (luminance(p.base10) > luminance(p.base00)) issues.push({ slot: "base10", message: `${name("base10")} should be darker than the main background` });
    if (luminance(p.base11) > luminance(p.base10)) issues.push({ slot: "base11", message: `${name("base11")} should be darker than the darkest background` });
  }

  for (const [bright, normal] of BRIGHT) {
    if (hexToOklch(p[bright]).L < hexToOklch(p[normal]).L) {
      issues.push({ slot: bright, message: `${name(bright)} should be lighter than ${name(normal).toLowerCase()}` });
    }
  }
  return issues;
}
