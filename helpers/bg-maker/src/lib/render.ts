import { buildGrid, type Grid } from "./hexgrid";
import type { ExportFormat, Settings } from "./settings";

const f = (n: number) => +n.toFixed(2);

// One SVG string is the single source for the preview and every export. Each
// hex is a <use> of one shared path, which keeps big grids small.
export function buildSvg(s: Settings, grid: Grid = buildGrid(s)): string {
  const { width: W, height: H } = s;
  const out: string[] = [];
  out.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`);
  out.push("<defs>");
  out.push(`<path id="h" d="${grid.shape}"/>`);
  // Fill layer with no gap: touching hexes leave a faint background line where
  // their anti-aliased edges meet. A stroke in each hex's own colour overlaps
  // the neighbours by 1 px and covers it; non-scaling keeps that 1 screen pixel
  // at any zoom, so the scaled-down preview is seamless too.
  const seams = s.gap === 0;
  if (seams) out.push(`<path id="hs" d="${grid.shape}" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`);
  if (s.shading > 0) {
    // Light comes from lightAngle (0° = from above); coordinates are per hex box
    const a = (s.lightAngle * Math.PI) / 180;
    const dx = Math.sin(a) / 2, dy = -Math.cos(a) / 2;
    const o = (s.shading / 100) * 0.55;
    out.push(
      `<linearGradient id="shade" x1="${f(0.5 + dx)}" y1="${f(0.5 + dy)}" x2="${f(0.5 - dx)}" y2="${f(0.5 - dy)}">` +
        `<stop offset="0" stop-color="#fff" stop-opacity="${f(o)}"/>` +
        `<stop offset="0.5" stop-color="#fff" stop-opacity="0"/>` +
        `<stop offset="0.5" stop-color="#000" stop-opacity="0"/>` +
        `<stop offset="1" stop-color="#000" stop-opacity="${f(o * 1.1)}"/>` +
        `</linearGradient>`,
    );
  }
  out.push("</defs>");
  if (!s.transparentBg) out.push(`<rect width="100%" height="100%" fill="${s.background}"/>`);

  const use = (x: number, y: number, attrs: string, id = "h") =>
    `<use href="#${id}" xlink:href="#${id}" x="${f(x)}" y="${f(y)}"${attrs}/>`;

  out.push("<g>");
  for (const c of grid.cells) out.push(seams ? use(c.x, c.y, ` fill="${c.fill}" stroke="${c.fill}"`, "hs") : use(c.x, c.y, ` fill="${c.fill}"`));
  out.push("</g>");

  if (s.shading > 0) {
    out.push(`<g fill="url(#shade)">`);
    for (const c of grid.cells) out.push(use(c.x, c.y, ""));
    out.push("</g>");
  }

  if (s.strokeWidth > 0) {
    const common = `fill="none" stroke-width="${s.strokeWidth}" stroke-linejoin="round" stroke-opacity="${s.strokeOpacity / 100}"`;
    if (s.strokeMode === "custom") {
      out.push(`<g ${common} stroke="${s.strokeColor}">`);
      for (const c of grid.cells) out.push(use(c.x, c.y, ""));
    } else {
      out.push(`<g ${common}>`);
      for (const c of grid.cells) out.push(use(c.x, c.y, ` stroke="${c.stroke}"`));
    }
    out.push("</g>");
  }

  out.push("</svg>");
  return out.join("");
}

export function svgBlob(svg: string): Blob {
  return new Blob([svg], { type: "image/svg+xml" });
}

async function rasterize(svg: string, s: Settings, format: Exclude<ExportFormat, "svg">): Promise<Blob> {
  const url = URL.createObjectURL(svgBlob(svg));
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = s.width;
    canvas.height = s.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not available");
    if (format === "jpeg") {
      // JPEG has no alpha; fill with the background even when it's "transparent"
      ctx.fillStyle = s.background;
      ctx.fillRect(0, 0, s.width, s.height);
    }
    ctx.drawImage(img, 0, 0, s.width, s.height);
    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob(res, `image/${format}`, format === "png" ? undefined : s.quality / 100),
    );
    if (!blob) throw new Error("The browser could not encode the image (too large?)");
    return blob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function exportImage(svg: string, s: Settings): Promise<{ blob: Blob; name: string }> {
  const ext = s.format === "jpeg" ? "jpg" : s.format;
  const name = `hex-${s.width}x${s.height}${s.tileable ? "-tile" : ""}-${s.seed}.${ext}`;
  const blob = s.format === "svg" ? svgBlob(svg) : await rasterize(svg, s, s.format);
  return { blob, name };
}

export function download(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 ** 2).toFixed(1)} MB`;
}
