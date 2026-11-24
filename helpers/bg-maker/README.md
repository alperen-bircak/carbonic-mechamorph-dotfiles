# Hex Background Maker

A small React app that makes hexagon-grid wallpapers and seamless tiles, and exports them as PNG, JPEG, WebP or SVG. Everything runs in the browser; nothing is uploaded.

## Running it

Needs Node (the LTS from nvm; `.nvmrc` says `lts/*`) and [just](https://github.com/casey/just).

```sh
just app     # build and open the app (port 5199)
just dev     # dev server with hot reload
just build   # static build in dist/; open dist/index.html via any web server
just check   # type-check
just clean   # remove dist/ and node_modules/
```

`just dev`, `just build` and `just app` run `npm install` on first use.

## What you can set

**Looks**: complete presets with thumbnails: four ayu looks built from the official ayu v9 colours (Light, Light Accents, Mirage, Mirage Glow, Dark, Dark Syntax), plus Honeycomb, Blueprint, Pastel Pop, Sunset Bands, Ocean Depth, Forest Floor and Mono Grain. Applying one keeps your canvas size, seamless mode and export format. You can undo it.

**Canvas**: resolution presets (1080p, 1440p, 4K, 5K, ultrawide, phone, …) or any size up to 16384 px a side, a button for this screen's native resolution, and a swap button for portrait.

**Seamless tile**: makes the image wrap at its edges, so it repeats without a visible seam (for tiled desktop backgrounds or web page backgrounds). The grid needs a whole number of hex periods to fit the canvas exactly, so the app picks the period count that bends the hexes least, then scales them slightly to fit. A note shows the hex size and stretch it ended up with. Colours, holes and the smooth noise all wrap too. The *Tiled* preview shows 3 × 3 copies so you can check the seams. Tilt is limited to 0° (pointy top) or 30° (flat top) here, and linear and radial gradients don't wrap. The app warns you about both.

**Grid**: hex size (centre to corner), gap (at 0, hexes overlap by a pixel so no hairline seams show, even in the scaled-down preview), rounded corners, and holes (a random share of hexes left out). Tilt is set with a dial that snaps to 5°, 15° or 30° steps, or free. Hold Shift while dragging to ignore the snap. Hexagons repeat every 60°, so 0–60° covers every look.

**Colours**: a palette of up to 12 colours, with presets, a harmony generator (shades, analogous, complementary, split, triadic, pastel), and reverse and shuffle. The palette is spread over the hexes in one of these ways:
- *Random*: each hex picks a palette colour
- *Linear*: a gradient at any angle
- *Radial*: a gradient from the centre
- *Noise*: smooth blobs

Gradients blend in OKLab, so they stay clean in the middle. *Jitter* moves each hex a bit along the gradient for a ragged edge. *Hard bands* uses the palette colours as-is. The background shows through gaps and holes and can be transparent.

Each colour picker has a 2D picker, a hex field, H/S/L sliders, recently used colours, and (in Chromium) an eyedropper. Paste a hex code (Ctrl+V) anywhere in an open picker to set the colour; `#ff8800`, `ff8800`, `0xff8800`, `#f80` and lines like `color: #ff8800;` all work.

**Variance**: random ± shifts in hue, saturation and lightness for each hex. *Grain → Clouds* blends per-hex randomness with smooth noise; *Cloud size* and *Cloud detail* (octaves) shape the noise. Everything comes from the seed, so the same settings always give the same image. The dice button or `R` rolls a new seed.

**Border & shading**: border width, a colour that is either custom or taken from each hex's fill (lighter or darker), border opacity, and a bevel with an adjustable light direction.

**Sway logo**: the sway tree (from the sway repo's `assets/Sway_Tree.svg`, CC0) centred on the canvas, drawn over the hexes. Its size is the logo's height as a share of the canvas's shorter side; the app shows the result in px. Each of its four colours (side, ground, trunk, leaves) has its own picker, with presets: *Original*, *Wallpaper* (white trunk, as on sway's default wallpaper), *White*, *Black* and *From palette* (the last four palette colours). Applying a Look keeps the logo settings.

**Export**: PNG, JPEG or WebP (quality slider) at full resolution, or SVG. SVGs stay small because each hex is a `<use>` of one shared path. You can also copy the SVG markup.

**Other**: undo and redo, *Surprise me* for random settings, settings saved as preset `.json` files or a share link, and settings kept between visits.

| Key | Action |
|---|---|
| `Ctrl+Z` / `Ctrl+Shift+Z` | undo / redo |
| `Ctrl+S` | export |
| `R` | new seed |
| double-click a slider label | reset that slider |
| arrow keys in a number field | step (Shift: ×10) |

## Code

- `src/lib/hexgrid.ts`: the grid: lattice, tilt, seamless fitting, colour per hex
- `src/lib/render.ts`: SVG output and rasterised export
- `src/lib/noise.ts`: seeded hash and periodic Perlin/fBm noise
- `src/lib/color.ts`: hex/HSL/OKLab conversions and palette sampling
- `src/lib/settings.ts`: settings type, defaults, palette presets, storage, share links
- `src/lib/looks.ts`: the complete Looks presets
- `src/lib/swayLogo.ts`: the sway tree logo paths, colour presets and placement
- `src/components/`: controls, colour picker, palette editor, angle dial, preview
