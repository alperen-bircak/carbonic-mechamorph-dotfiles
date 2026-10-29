import { DEFAULTS, type Settings } from "./settings";

// Complete looks. Applying one keeps the canvas size, seamless mode and export
// format; everything else comes from the look (over the defaults).
export type Look = { name: string; settings: Partial<Settings> };

// Official ayu v9 colours (ayu npm package): surfaces and syntax colours
const ayu = {
  light: { sunk: "#ebeef0", base: "#f8f9fa", lift: "#fcfcfc", panel: "#fafafa", keyword: "#fa8532", tag: "#55b4d4", string: "#86b300" },
  mirage: { line: "#171b24", sunk: "#181c26", base: "#1f2430", lift: "#242936", panel: "#282e3b", keyword: "#ffa659", accent: "#ffcc66" },
  dark: {
    sunk: "#010102", base: "#0d1017", lift: "#10141c", panel: "#141821", line: "#1b1f29",
    syntax: ["#39bae6", "#ffb454", "#59c2ff", "#aad94c", "#f07178", "#ff8f40", "#d2a6ff", "#95e6cb"],
  },
};

const flat = { hueVar: 0, satVar: 0, lightVar: 0, shading: 0, strokeWidth: 0, holes: 0, angle: 0 };

export const LOOKS: Look[] = [
  {
    name: "Ayu Light",
    settings: {
      ...flat, palette: [ayu.light.lift, ayu.light.panel, ayu.light.base, ayu.light.sunk],
      distribution: "linear", gradientAngle: 160, jitter: 35, background: "#d6dce2",
      size: 44, gap: 3, corner: 20, lightVar: 1.5, varSmooth: 40,
    },
  },
  {
    name: "Ayu Light Accents",
    settings: {
      ...flat,
      palette: [
        ayu.light.lift, ayu.light.lift, ayu.light.base, ayu.light.base, ayu.light.base, ayu.light.panel,
        ayu.light.panel, ayu.light.sunk, ayu.light.sunk, ayu.light.sunk, ayu.light.keyword, ayu.light.tag,
      ],
      distribution: "random", background: "#ffffff", size: 36, gap: 4, corner: 25, lightVar: 1, seed: 4242,
    },
  },
  {
    name: "Ayu Mirage",
    settings: {
      ...flat, palette: [ayu.mirage.sunk, ayu.mirage.base, ayu.mirage.lift, ayu.mirage.panel],
      distribution: "noise", paletteScale: 900, jitter: 20, background: ayu.mirage.line,
      size: 52, gap: 0, corner: 0, strokeWidth: 1, strokeMode: "derived", strokeShift: 4,
      lightVar: 1.5, varSmooth: 60,
    },
  },
  {
    name: "Ayu Mirage Glow",
    settings: {
      ...flat, palette: [ayu.mirage.base, ayu.mirage.lift, ayu.mirage.panel, ayu.mirage.keyword],
      distribution: "linear", gradientAngle: 135, jitter: 30, background: ayu.mirage.line,
      size: 48, gap: 3, corner: 18, lightVar: 1.5, varSmooth: 50,
    },
  },
  {
    name: "Ayu Dark",
    settings: {
      ...flat, palette: [ayu.dark.base, ayu.dark.lift, ayu.dark.panel, ayu.dark.line],
      distribution: "linear", gradientAngle: 180, jitter: 25, background: ayu.dark.sunk,
      size: 64, gap: 2, corner: 12, lightVar: 2, varSmooth: 40, shading: 20, lightAngle: 315,
    },
  },
  {
    name: "Ayu Dark Syntax",
    settings: {
      ...flat, palette: ayu.dark.syntax, distribution: "random", holes: 82, background: ayu.dark.base,
      size: 34, gap: 6, corner: 30, lightVar: 4, varSmooth: 0, seed: 909,
    },
  },
  {
    name: "Honeycomb",
    settings: {
      ...flat, palette: ["#f6b93b", "#e58e26", "#fad390", "#f8c291"], distribution: "noise", paletteScale: 600,
      background: "#b9770e", size: 42, gap: 0, corner: 0, strokeWidth: 2.5, strokeMode: "derived", strokeShift: -18,
      shading: 35, lightAngle: 315, lightVar: 5, varSmooth: 30,
    },
  },
  {
    name: "Blueprint",
    settings: {
      ...flat, palette: ["#1d4e89"], distribution: "random", background: "#163d6d", size: 46, gap: 0, corner: 0,
      strokeWidth: 1.25, strokeMode: "custom", strokeColor: "#ffffff", strokeOpacity: 28,
      lightVar: 2.5, varSmooth: 80, varScale: 600,
    },
  },
  {
    name: "Pastel Pop",
    settings: {
      ...flat, palette: ["#ffd6e0", "#ffefb5", "#c1f0dc", "#c3d9ff"], distribution: "random", background: "#ffffff",
      size: 40, gap: 6, corner: 40, shading: 55, lightAngle: 315, lightVar: 2,
    },
  },
  {
    name: "Sunset Bands",
    settings: {
      ...flat, palette: ["#1a1033", "#4b1d5c", "#a3346b", "#f06c5a", "#ffb36b"], distribution: "linear",
      gradientAngle: 180, stepped: true, jitter: 22, angle: 15, background: "#120a24",
      size: 38, gap: 2, corner: 10, lightVar: 2,
    },
  },
  {
    name: "Ocean Depth",
    settings: {
      ...flat, palette: ["#6fc2c8", "#1f7a8c", "#134b6e", "#0b1d33"], distribution: "radial", jitter: 15,
      background: "#07121f", size: 50, gap: 3, corner: 25, lightVar: 4, varSmooth: 70,
    },
  },
  {
    name: "Forest Floor",
    settings: {
      ...flat, palette: ["#13201a", "#24412f", "#3f6b46", "#8fb573"], distribution: "noise", paletteScale: 700,
      background: "#0c140f", size: 30, gap: 2, corner: 30, holes: 8, hueVar: 8, lightVar: 5, varSmooth: 50,
    },
  },
  {
    name: "Mono Grain",
    settings: {
      ...flat, palette: ["#2a2a2a"], distribution: "random", background: "#151515",
      size: 24, gap: 1.5, corner: 0, lightVar: 7, varSmooth: 0,
    },
  },
];

export function applyLook(current: Settings, look: Look): Settings {
  return {
    ...DEFAULTS,
    seed: 1337,
    ...look.settings,
    width: current.width,
    height: current.height,
    tileable: current.tileable,
    format: current.format,
    quality: current.quality,
  };
}
