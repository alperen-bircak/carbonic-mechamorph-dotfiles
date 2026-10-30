import {
  type Color,
  type ThemeName,
  formatRgb,
  inkFor,
  leaves,
  normalizeHex,
  resolve,
  themeNames,
  themes,
  usage,
} from "./lib/ayu";
import "./styles.css";

declare const __AYU_VERSION__: string;

type CopyMode = "hex" | "rgb" | "path";

// Section order from palette.svg; sections a newer ayu adds go at the end
const sectionOrder = ["palette", "syntax", "terminal", "vcs", "surface", "editor", "ui", "common"];

const sheet = document.getElementById("sheet")!;
const filterInput = document.getElementById("filter") as HTMLInputElement;
const tip = document.getElementById("tip")!;
const toast = document.getElementById("toast")!;

const used = Object.fromEntries(themeNames.map((t) => [t, usage(themes[t])])) as Record<ThemeName, Map<string, string[]>>;

/** Opaque hex → palette step, per theme, so tokens can say which step they are */
const paletteOf = Object.fromEntries(
  themeNames.map((t) => [
    t,
    new Map(leaves(themes[t].palette, "palette").map((l) => [l.color.hex(), l.path])),
  ]),
) as Record<ThemeName, Map<string, string>>;

let copyMode: CopyMode = (localStorage.getItem("ayu-colors:copy") as CopyMode) ?? "hex";

function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Omit<HTMLElementTagNameMap[K], "dataset" | "style">> & {
    dataset?: Record<string, string>;
    style?: string;
  } = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  const { dataset, style, ...rest } = props;
  Object.assign(el, rest);
  if (dataset) Object.assign(el.dataset, dataset);
  if (style) el.setAttribute("style", style);
  el.append(...children);
  return el;
}

const bgOf = (t: ThemeName) => themes[t].surface.base;

/* ---------- Building the sheet ---------- */

function themeCell(t: ThemeName, ...children: Node[]) {
  return h("div", { className: `cell theme-${t}`, style: `--col:${bgOf(t).hex()}` }, ...children);
}

function swatch(t: ThemeName, path: string, color: Color, className: string, label: string) {
  const hex = color.hex();
  const el = h(
    "button",
    {
      type: "button",
      className: `swatch ${className}`,
      style: `--c:${hex};--ink:${inkFor(color, bgOf(t))}`,
      dataset: { theme: t, path, hex },
    },
    h("span", { className: "hex" }, label),
  );
  el.setAttribute("aria-label", `${t} ${path} ${hex}`);
  if (path.startsWith("palette.") && used[t].has(hex)) el.classList.add("used");
  return el;
}

function headRow() {
  return h(
    "div",
    { className: "row head" },
    h("div", { className: "label" }, "Color"),
    ...themeNames.map((t) =>
      themeCell(
        t,
        h(
          "span",
          { className: "theme-name", style: `color:${themes[t].editor.fg.hex()}` },
          t[0].toUpperCase() + t.slice(1),
        ),
      ),
    ),
  );
}

function sectionRow(name: string) {
  return h(
    "div",
    { className: "row section", dataset: { section: name } },
    h("div", { className: "label" }, name),
    ...themeNames.map((t) => themeCell(t)),
  );
}

function paletteRow(hue: string) {
  const row = h("div", { className: "row palette", dataset: { section: "palette", name: hue } });
  row.append(h("div", { className: "label" }, hue));
  for (const t of themeNames) {
    const steps = leaves(resolve(themes[t], `palette.${hue}`)?.node, `palette.${hue}`);
    const grid = h("div", { className: "steps" });
    for (const { path, color } of steps) {
      const step = path.split(".").pop()!.toUpperCase();
      grid.append(
        h(
          "div",
          { className: "step" },
          swatch(t, path, color, "tile", color.hex().slice(1)),
          h("span", { className: "step-name" }, step),
        ),
      );
    }
    row.append(themeCell(t, grid));
  }
  return row;
}

function tokenRow(section: string, path: string) {
  const row = h("div", { className: "row token", dataset: { section, name: path } });
  row.append(h("div", { className: "label", title: path }, path.slice(section.length + 1)));
  for (const t of themeNames) {
    const found = resolve(themes[t], path);
    const color = found?.node as Color | undefined;
    row.append(themeCell(t, ...(color ? [swatch(t, path, color, "bar", color.hex().toUpperCase())] : [])));
  }
  return row;
}

function build() {
  // Union of paths over all themes, in first-seen order
  const paths = [...new Set(themeNames.flatMap((t) => leaves(themes[t]).map((l) => l.path)))];
  const sections = [...new Set(paths.map((p) => p.split(".")[0]))].sort(
    (a, b) => (sectionOrder.indexOf(a) + 1 || 99) - (sectionOrder.indexOf(b) + 1 || 99),
  );

  sheet.append(headRow());
  for (const section of sections) {
    sheet.append(sectionRow(section));
    if (section === "palette") {
      for (const hue of Object.keys(themes.light.palette)) sheet.append(paletteRow(hue));
    } else {
      for (const path of paths.filter((p) => p.startsWith(`${section}.`))) sheet.append(tokenRow(section, path));
    }
  }
  sheet.append(h("div", { className: "row foot" }, h("div", { className: "label" }), ...themeNames.map((t) => themeCell(t))));
}

/* ---------- Copying ---------- */

function textFor(el: HTMLElement): string {
  const { theme, path, hex } = el.dataset as { theme: ThemeName; path: string; hex: string };
  if (copyMode === "path") return `${theme}.${path}`;
  if (copyMode === "rgb") return formatRgb(resolve(themes[theme], path)!.node as Color);
  return hex;
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    // No async clipboard (file:// or an old browser)
    const area = h("textarea", { value: text, style: "position:fixed;opacity:0" });
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
  }
}

let toastTimer = 0;
function showToast(el: HTMLElement, text: string) {
  toast.replaceChildren(
    h("span", { className: "toast-chip", style: `--c:${el.dataset.hex}` }),
    h("span", {}, "Copied "),
    h("code", {}, text),
  );
  toast.classList.add("on");
  clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("on"), 1600);
}

sheet.addEventListener("click", async (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>(".swatch");
  if (!el) return;
  const text = textFor(el);
  await copy(text);
  showToast(el, text);
  el.classList.remove("copied");
  void el.offsetWidth; // restart the animation
  el.classList.add("copied");
});

const copyAs = document.getElementById("copy-as")!;
function setCopyMode(mode: CopyMode) {
  copyMode = mode;
  localStorage.setItem("ayu-colors:copy", mode);
  for (const b of copyAs.querySelectorAll<HTMLButtonElement>("button")) {
    b.setAttribute("aria-checked", String(b.dataset.mode === mode));
  }
}
copyAs.addEventListener("click", (e) => {
  const b = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
  if (b) setCopyMode(b.dataset.mode as CopyMode);
});

/* ---------- Tooltip ---------- */

function tipLines(el: HTMLElement): (Node | string)[] {
  const { theme, path, hex } = el.dataset as { theme: ThemeName; path: string; hex: string };
  const color = resolve(themes[theme], path)!.node as Color;
  const lines: (Node | string)[] = [
    h("div", { className: "tip-head" }, h("span", { className: "tip-theme" }, theme), path),
    h("div", { className: "tip-values" }, h("code", {}, hex), h("code", {}, formatRgb(color))),
  ];
  const note = (label: string, items: string[]) =>
    h("div", { className: "tip-note" }, h("span", {}, label), items.join(", "));
  if (path.startsWith("palette.")) {
    const users = used[theme].get(hex);
    if (users) lines.push(note("used by", users));
  } else {
    const step = paletteOf[theme].get(hex.slice(0, 7));
    if (step) lines.push(note(hex.length > 7 ? "from" : "same as", [step]));
  }
  lines.push(h("div", { className: "tip-hint" }, `click to copy ${copyMode === "path" ? "path" : copyMode.toUpperCase()}`));
  return lines;
}

function showTip(el: HTMLElement) {
  tip.replaceChildren(...tipLines(el));
  tip.hidden = false;
  const r = el.getBoundingClientRect();
  const w = tip.offsetWidth;
  const left = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
  const below = r.top < tip.offsetHeight + 80;
  tip.style.left = `${left}px`;
  tip.style.top = `${below ? r.bottom + 8 : r.top - tip.offsetHeight - 8}px`;
}

sheet.addEventListener("pointerover", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>(".swatch");
  if (el) showTip(el);
});
sheet.addEventListener("pointerout", (e) => {
  if ((e.target as HTMLElement).closest(".swatch")) tip.hidden = true;
});
sheet.addEventListener("focusin", (e) => {
  const el = (e.target as HTMLElement).closest<HTMLElement>(".swatch");
  if (el?.matches(":focus-visible")) showTip(el);
});
sheet.addEventListener("focusout", () => (tip.hidden = true));
addEventListener("scroll", () => (tip.hidden = true), { passive: true });

/* ---------- Filter ---------- */

function applyFilter() {
  const q = filterInput.value.trim().toLowerCase();
  const hex = /^#?[0-9a-f]{3,8}$/.test(q) ? q.replace(/^#/, "") : null;
  const full = hex ? normalizeHex(hex)?.slice(1) : null;

  for (const s of sheet.querySelectorAll<HTMLElement>(".swatch")) {
    const h6 = s.dataset.hex!.slice(1);
    s.classList.toggle("match", !!hex && (h6.startsWith(hex) || (!!full && h6.startsWith(full))));
  }
  let any = false;
  const visible = new Set<string>();
  for (const row of sheet.querySelectorAll<HTMLElement>(".row.palette, .row.token")) {
    const name = `${row.dataset.section}.${row.dataset.name}`.toLowerCase();
    const show = !q || name.includes(q) || row.querySelector(".match") !== null;
    row.hidden = !show;
    if (show) {
      visible.add(row.dataset.section!);
      any = true;
    }
  }
  for (const row of sheet.querySelectorAll<HTMLElement>(".row.section")) {
    row.hidden = !visible.has(row.dataset.section!);
  }
  document.getElementById("empty")!.hidden = any;
}

filterInput.addEventListener("input", applyFilter);
filterInput.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    filterInput.value = "";
    applyFilter();
    filterInput.blur();
  }
});
addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== filterInput) {
    e.preventDefault();
    filterInput.focus();
    filterInput.select();
  }
});

/* ---------- Start ---------- */

document.getElementById("version")!.textContent = `v${__AYU_VERSION__}`;
build();
setCopyMode(copyMode);
// ?q=… pre-fills the filter, for bookmarks
filterInput.value = new URLSearchParams(location.search).get("q") ?? "";
applyFilter();
