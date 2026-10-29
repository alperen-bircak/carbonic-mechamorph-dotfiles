import { hexToHsl, hslToHex } from "./color";

export type Harmony = "shades" | "analogous" | "complementary" | "triadic" | "split" | "pastel";

export const HARMONIES: { id: Harmony; label: string }[] = [
  { id: "shades", label: "Shades" },
  { id: "analogous", label: "Analogous" },
  { id: "complementary", label: "Complement" },
  { id: "split", label: "Split" },
  { id: "triadic", label: "Triadic" },
  { id: "pastel", label: "Pastel" },
];

// Build a palette around a base colour
export function harmony(base: string, kind: Harmony, count = 4): string[] {
  const { h, s, l } = hexToHsl(base);
  const at = (dh: number, ds = 0, dl = 0) => hslToHex({ h: h + dh, s: s + ds, l: l + dl });
  const spread = (i: number) => (count === 1 ? 0 : i / (count - 1) - 0.5); // -0.5 … 0.5
  const out: string[] = [];
  for (let i = 0; i < count; i++) {
    const t = spread(i);
    switch (kind) {
      case "shades":
        out.push(hslToHex({ h, s, l: Math.min(92, Math.max(8, l + t * 44)) }));
        break;
      case "analogous":
        out.push(at(t * 70, 0, t * 10));
        break;
      case "complementary":
        out.push(i < count / 2 ? at(0, 0, t * 24) : at(180, -8, t * 24));
        break;
      case "split":
        out.push(at([0, 150, 210, 0][i % 4], 0, i >= 3 ? 18 : 0));
        break;
      case "triadic":
        out.push(at([0, 120, 240][i % 3], 0, i >= 3 ? -16 : 0));
        break;
      case "pastel":
        out.push(hslToHex({ h: h + i * (360 / count), s: 70, l: 86 }));
        break;
    }
  }
  return out;
}

export function randomColor(): string {
  return hslToHex({ h: Math.random() * 360, s: 35 + Math.random() * 50, l: 25 + Math.random() * 50 });
}
