#!/usr/bin/env node
// Look up ayu colours from the `ayu` npm package. Run with `just color …`
// (or `node scripts/ayu-color.ts …`); `--help` lists the commands.
import { parseArgs } from "node:util";
import {
  type Color,
  type ThemeName,
  formatRgb,
  isColor,
  isTheme,
  leaves,
  normalizeHex,
  resolve,
  themeNames,
  themes,
} from "../src/lib/ayu.ts";

const help = `Usage:
  ayu-color <theme> <path>      one colour             ayu-color dark syntax.keyword
  ayu-color <theme> [group]     every colour in group  ayu-color mirage terminal
  ayu-color all <path|group>    all three themes       ayu-color all editor.bg
  ayu-color find <hex> [theme]  tokens with a colour   ayu-color find ff8f40
  ayu-color paths               every path
  ayu-color themes              the theme names

Themes: ${themeNames.join(", ")}. Paths are dotted and case-insensitive; palette
hues can skip "palette." (blue.l3 = palette.blue.l3). Groups: ${Object.keys(themes.dark).join(", ")}.

Options:
  -f, --format hex|rgb|json   output format (default hex)
      --no-swatch             no colour blocks, even in a terminal
  -h, --help                  this help`;

const { values: opts, positionals: args } = parseArgs({
  allowPositionals: true,
  options: {
    format: { type: "string", short: "f", default: "hex" },
    "no-swatch": { type: "boolean", default: false },
    help: { type: "boolean", short: "h", default: false },
  },
});

function fail(message: string): never {
  console.error(`ayu-color: ${message}`);
  process.exit(1);
}

const format = opts.format;
if (format !== "hex" && format !== "rgb" && format !== "json") {
  fail(`unknown format "${format}" (hex, rgb or json)`);
}
const swatches = process.stdout.isTTY && !process.env.NO_COLOR && !opts["no-swatch"];

const show = (c: Color) => (format === "rgb" ? formatRgb(c) : c.hex());

const asJson = (theme: ThemeName, path: string, c: Color) => {
  const [r, g, b, alpha] = c.rgba();
  return { theme, path, hex: c.hex(), rgb: [r, g, b], alpha };
};

/** A truecolor block, with alpha colours drawn over the theme's background */
function swatch(theme: ThemeName, c: Color): string {
  if (!swatches) return "";
  const [r, g, b] = c.blend(themes[theme].surface.base).rgb();
  return `\x1b[48;2;${r};${g};${b}m    \x1b[0m `;
}

function table(rows: string[][]): string {
  const widths = rows[0].map((_, i) => Math.max(...rows.map((row) => visible(row[i]).length)));
  return rows
    .map((row) => row.map((cell, i) => cell + " ".repeat(widths[i] - visible(cell).length)).join("  ").trimEnd())
    .join("\n");
}

const visible = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");

function theme(name: string): ThemeName {
  const t = name.toLowerCase().replace(/^ayu[-_ ]?/, "");
  if (!isTheme(t)) fail(`unknown theme "${name}" (${themeNames.join(", ")}, all)`);
  return t;
}

function lookup(t: ThemeName, path: string) {
  const found = resolve(themes[t], path);
  if (found) return found;
  const last = path.split(".").pop()!.toLowerCase();
  const near = leaves(themes[t])
    .map((l) => l.path)
    .filter((p) => p.toLowerCase().includes(last))
    .slice(0, 8);
  fail(`no colour or group "${path}"${near.length ? `\nDid you mean: ${near.join(", ")}` : ""}`);
}

function one(t: ThemeName, path: string) {
  const { node, path: full } = lookup(t, path);
  if (isColor(node)) {
    console.log(format === "json" ? JSON.stringify(asJson(t, full, node), null, 2) : show(node));
    return;
  }
  const list = leaves(node, full);
  if (format === "json") {
    console.log(JSON.stringify(list.map((l) => asJson(t, l.path, l.color)), null, 2));
  } else {
    console.log(table(list.map((l) => [l.path, swatch(t, l.color) + show(l.color)])));
  }
}

function all(path: string) {
  const found = themeNames.map((t) => ({ t, ...lookup(t, path) }));
  const { node, path: full } = found[0];
  if (isColor(node)) {
    if (format === "json") {
      console.log(JSON.stringify(found.map((f) => asJson(f.t, f.path, f.node as Color)), null, 2));
    } else {
      console.log(table(found.map((f) => [f.t, swatch(f.t, f.node as Color) + show(f.node as Color)])));
    }
    return;
  }
  const paths = leaves(node, full).map((l) => l.path);
  const color = (t: ThemeName, p: string) => resolve(themes[t], p)!.node as Color;
  if (format === "json") {
    console.log(JSON.stringify(paths.flatMap((p) => themeNames.map((t) => asJson(t, p, color(t, p)))), null, 2));
  } else {
    const head = ["", ...themeNames];
    const rows = paths.map((p) => [p, ...themeNames.map((t) => swatch(t, color(t, p)) + show(color(t, p)))]);
    console.log(table([head, ...rows]));
  }
}

/** "redmean" RGB distance: cheap and close enough to perceptual for ranking */
function distance(a: number[], b: number[]): number {
  const r = (a[0] + b[0]) / 2;
  const [dr, dg, db] = [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  return Math.sqrt((2 + r / 256) * dr * dr + 4 * dg * dg + (2 + (255 - r) / 256) * db * db);
}

function find(input: string, only?: ThemeName) {
  const hex = normalizeHex(input);
  if (!hex) fail(`"${input}" isn't a hex colour`);
  const target = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const all = (only ? [only] : themeNames).flatMap((t) =>
    leaves(themes[t]).map((l) => ({ t, ...l, hex: l.color.hex() })),
  );
  // Exact matches, ignoring alpha unless the query has some
  let hits = all.filter((l) => (hex.length === 9 ? l.hex === hex : l.hex.slice(0, 7) === hex));
  const exact = hits.length > 0;
  if (!exact) {
    hits = all
      .filter((l) => l.color.getAlpha() === 1)
      .sort((a, b) => distance(a.color.rgb(), target) - distance(b.color.rgb(), target))
      .slice(0, 6);
  }
  if (format === "json") {
    console.log(JSON.stringify({ exact, matches: hits.map((h) => asJson(h.t, h.path, h.color)) }, null, 2));
    return;
  }
  if (!exact) console.error(`No exact match for ${hex}; nearest:`);
  console.log(table(hits.map((h) => [h.t, h.path, swatch(h.t, h.color) + show(h.color)])));
}

const [command, ...rest] = args;
if (opts.help || !command) {
  console.log(help);
} else if (command === "themes") {
  console.log(themeNames.join("\n"));
} else if (command === "paths") {
  console.log(leaves(themes.dark).map((l) => l.path).join("\n"));
} else if (command === "find") {
  if (!rest[0]) fail("find needs a hex colour");
  find(rest[0], rest[1] ? theme(rest[1]) : undefined);
} else if (command === "all") {
  all(rest[0] ?? "");
} else {
  one(theme(command), rest[0] ?? "");
}
