import { hexToHsl, hslToHex, samplePalette } from "./color";
import { fbm, hash3 } from "./noise";
import type { Settings } from "./settings";

export type Cell = { x: number; y: number; fill: string; stroke?: string };

export type Grid = {
  cells: Cell[];
  shape: string; // path for one hex centred on 0,0
  // Seamless mode only: tile period in hexes and the stretch used to fit it
  tile?: { cols: number; rows: number; stretchX: number; stretchY: number };
};

const SQRT3 = Math.sqrt(3);
const mod = (a: number, n: number) => ((a % n) + n) % n;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// The tilt actually used: seamless tiles only work on the lattice's own axes,
// so there it rounds to 0° (pointy top) or 30° (flat top).
export function effectiveAngle(s: Settings): number {
  if (s.tileable) return mod(Math.round(s.angle / 30), 2) * 30;
  return s.angle;
}

// Hex outline with optional rounded corners (quadratic curves at the vertices)
function hexPath(r: number, angleDeg: number, corner: number, sx: number, sy: number): string {
  const pts: [number, number][] = [];
  for (let k = 0; k < 6; k++) {
    const a = ((angleDeg + 30 + 60 * k) * Math.PI) / 180;
    pts.push([Math.cos(a) * r * sx, Math.sin(a) * r * sy]);
  }
  const f = (n: number) => +n.toFixed(3);
  if (corner <= 0) return `M${pts.map(([x, y]) => `${f(x)} ${f(y)}`).join("L")}Z`;
  const t = Math.min(0.5, (corner / 100) * 0.5); // 100 % = curves meet at edge midpoints
  const lerp = (a: [number, number], b: [number, number], u: number) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  let d = "";
  for (let k = 0; k < 6; k++) {
    const prev = pts[(k + 5) % 6], cur = pts[k], next = pts[(k + 1) % 6];
    const [ax, ay] = lerp(cur, prev, t);
    const [bx, by] = lerp(cur, next, t);
    d += `${k === 0 ? "M" : "L"}${f(ax)} ${f(ay)}Q${f(cur[0])} ${f(cur[1])} ${f(bx)} ${f(by)}`;
  }
  return d + "Z";
}

// Turn a signed noise value into something that uses the full range
const spreadNoise = (n: number) => Math.max(-1, Math.min(1, n * 1.7));

export function buildGrid(s: Settings): Grid {
  const W = Math.max(1, s.width), H = Math.max(1, s.height);
  const r = Math.max(2, s.size);
  const angle = effectiveAngle(s);
  const flat = s.tileable && angle === 30;

  // Seamless: fit a whole number of lattice periods into the canvas and scale
  // so they land exactly on the edges. Of the nearby period counts, pick the
  // one that distorts the hex shape least; a slightly different size is fine.
  let sx = 1, sy = 1, nCols = 0, nRows = 0;
  if (s.tileable) {
    const pw = flat ? 3 * r : SQRT3 * r;
    const ph = flat ? SQRT3 * r : 3 * r;
    const n0 = Math.round(W / pw), m0 = Math.round(H / ph);
    let best = Infinity;
    for (let n = Math.max(1, n0 - 2); n <= n0 + 2; n++) {
      for (let m = Math.max(1, m0 - 2); m <= m0 + 2; m++) {
        const fx = W / (n * pw), fy = H / (m * ph);
        const score = 4 * Math.abs(Math.log(fx / fy)) + Math.abs(Math.log(fx * fy) / 2);
        if (score < best) { best = score; nCols = n; nRows = m; sx = fx; sy = fy; }
      }
    }
  }
  const cw = W / sx, ch = H / sy; // canvas in unstretched units

  // Lattice vectors, rotated by the tilt
  const th = (angle * Math.PI) / 180, c = Math.cos(th), sn = Math.sin(th);
  const a1x = SQRT3 * r * c, a1y = SQRT3 * r * sn;
  const a2x = (SQRT3 / 2) * r * c - 1.5 * r * sn, a2y = (SQRT3 / 2) * r * sn + 1.5 * r * c;
  const det = a1x * a2y - a2x * a1y;

  // Lattice index range that covers the canvas plus a hex of margin
  let iMin = Infinity, iMax = -Infinity, jMin = Infinity, jMax = -Infinity;
  for (const [px, py] of [[-r, -r], [cw + r, -r], [-r, ch + r], [cw + r, ch + r]]) {
    const i = (px * a2y - py * a2x) / det, j = (py * a1x - px * a1y) / det;
    iMin = Math.min(iMin, i); iMax = Math.max(iMax, i);
    jMin = Math.min(jMin, j); jMax = Math.max(jMax, j);
  }
  iMin = Math.floor(iMin) - 1; iMax = Math.ceil(iMax) + 1;
  jMin = Math.floor(jMin) - 1; jMax = Math.ceil(jMax) + 1;

  const seed = s.seed | 0;
  const pal = s.palette.length ? s.palette : ["#808080"];
  const hasVar = s.hueVar > 0 || s.satVar > 0 || s.lightVar > 0;
  const smooth = s.varSmooth / 100;

  // Noise frequencies; seamless mode rounds them so the noise wraps exactly
  const periodic = (scale: number) => {
    const fx = Math.max(1, Math.round(W / Math.max(1, scale)));
    const fy = Math.max(1, Math.round(H / Math.max(1, scale)));
    return { fx, fy };
  };
  const varF = periodic(s.varScale), palF = periodic(s.paletteScale);

  // Gradient direction (CSS style: 0° points up, 90° right), normalised so t
  // runs 0 → 1 corner to corner
  const ga = (s.gradientAngle * Math.PI) / 180, gc = Math.sin(ga), gs = -Math.cos(ga);
  const gHalf = (Math.abs(W * gc) + Math.abs(H * gs)) / 2 || 1;
  const halfDiag = Math.hypot(W, H) / 2;

  const cells: Cell[] = [];
  for (let j = jMin; j <= jMax; j++) {
    for (let i = iMin; i <= iMax; i++) {
      const ux = i * a1x + j * a2x, uy = i * a1y + j * a2y;
      if (ux < -r || ux > cw + r || uy < -r || uy > ch + r) continue;
      const x = ux * sx, y = uy * sy;

      // Identity of the cell. In seamless mode, cells one period apart share
      // it, so they get the same colour and the edges match up.
      let kx = i, ky = j, u = 0, v = 0;
      if (s.tileable) {
        if (flat) {
          kx = mod(i, 2 * nCols); ky = mod(i + 2 * j, 2 * nRows);
        } else {
          kx = mod(2 * i + j, 2 * nCols); ky = mod(j, 2 * nRows);
        }
        u = kx / (2 * nCols); v = ky / (2 * nRows);
      }
      const rnd = (chan: number) => hash3(kx, ky, seed * 31 + chan);
      const noise = (chan: number, scale: number, f: { fx: number; fy: number }, octaves: number) =>
        s.tileable
          ? fbm(u * f.fx, v * f.fy, seed * 17 + chan, octaves, f.fx, f.fy)
          : fbm(x / Math.max(1, scale), y / Math.max(1, scale), seed * 17 + chan, octaves);

      if (s.holes > 0 && rnd(99) < s.holes / 100) continue;

      // Base colour from the palette
      let fill: string;
      const jit = ((rnd(7) - 0.5) * s.jitter) / 100;
      switch (s.distribution) {
        case "random":
          fill = pal[Math.min(pal.length - 1, Math.floor(rnd(5) * pal.length))];
          break;
        case "linear": {
          const t = ((x - W / 2) * gc + (y - H / 2) * gs) / gHalf / 2 + 0.5;
          fill = samplePalette(pal, clamp01(t + jit), s.stepped);
          break;
        }
        case "radial": {
          const t = Math.hypot(x - W / 2, y - H / 2) / halfDiag;
          fill = samplePalette(pal, clamp01(t + jit), s.stepped);
          break;
        }
        case "noise": {
          const t = spreadNoise(noise(50, s.paletteScale, palF, 3)) / 2 + 0.5;
          fill = samplePalette(pal, clamp01(t + jit), s.stepped);
          break;
        }
      }

      // HSL variance: a blend of per-hex grain and smooth noise
      if (hasVar) {
        const hsl = hexToHsl(fill);
        const vary = (chan: number) => {
          const grain = rnd(chan) * 2 - 1;
          if (smooth === 0) return grain;
          const cloud = spreadNoise(noise(chan, s.varScale, varF, s.varOctaves));
          return grain * (1 - smooth) + cloud * smooth;
        };
        if (s.hueVar > 0) hsl.h += vary(1) * s.hueVar;
        if (s.satVar > 0) hsl.s += vary(2) * s.satVar;
        if (s.lightVar > 0) hsl.l += vary(3) * s.lightVar;
        fill = hslToHex(hsl);
      }

      const cell: Cell = { x, y, fill };
      if (s.strokeWidth > 0 && s.strokeMode === "derived") {
        const hsl = hexToHsl(fill);
        hsl.l += s.strokeShift;
        cell.stroke = hslToHex(hsl);
      }
      cells.push(cell);
    }
  }

  // With no gap, grow each hex by half a pixel so neighbours overlap; otherwise
  // the anti-aliased edges of two touching hexes let the background show
  // through as a faint line.
  const bleed = s.gap === 0 ? 0.5 * (2 / SQRT3) : 0;
  const drawR = Math.max(0.5, r - s.gap / SQRT3) + bleed;
  return {
    cells,
    shape: hexPath(drawR, angle, s.corner, sx, sy),
    tile: s.tileable ? { cols: nCols, rows: nRows, stretchX: sx, stretchY: sy } : undefined,
  };
}
