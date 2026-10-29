// Seeded, deterministic noise. Everything is a pure function of (seed, coords),
// so the same settings always give the same image.

// Integer hash of up to three ints -> [0, 1)
export function hash3(x: number, y: number, z: number): number {
  let h = Math.imul(x | 0, 0x27d4eb2d) ^ Math.imul(y | 0, 0x165667b1) ^ Math.imul(z | 0, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const mod = (a: number, n: number) => ((a % n) + n) % n;

function grad(ix: number, iy: number, seed: number, dx: number, dy: number): number {
  const a = hash3(ix, iy, seed) * Math.PI * 2;
  return Math.cos(a) * dx + Math.sin(a) * dy;
}

// 2D Perlin noise in about [-1, 1]. With px/py > 0 it repeats every px × py
// units, which is what makes smooth variance tile seamlessly.
export function perlin(x: number, y: number, seed: number, px = 0, py = 0): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const wx = (i: number) => (px > 0 ? mod(i, px) : i);
  const wy = (i: number) => (py > 0 ? mod(i, py) : i);
  const n00 = grad(wx(x0), wy(y0), seed, fx, fy);
  const n10 = grad(wx(x0 + 1), wy(y0), seed, fx - 1, fy);
  const n01 = grad(wx(x0), wy(y0 + 1), seed, fx, fy - 1);
  const n11 = grad(wx(x0 + 1), wy(y0 + 1), seed, fx - 1, fy - 1);
  const u = fade(fx), v = fade(fy);
  const a = n00 + (n10 - n00) * u;
  const b = n01 + (n11 - n01) * u;
  return (a + (b - a) * v) * 1.41;
}

// Fractal sum of Perlin octaves; periods double with each octave so tiling holds
export function fbm(x: number, y: number, seed: number, octaves: number, px = 0, py = 0): number {
  let sum = 0, amp = 1, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * perlin(x * f, y * f, seed + o * 1013, px * f, py * f);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return Math.max(-1, Math.min(1, sum / norm));
}
