# ayu colors

Every colour in the [`ayu`](https://www.npmjs.com/package/ayu) npm package (light, mirage and dark), as a page laid out like ayu's [palette.svg](https://github.com/ayu-theme/ayu-colors/blob/master/palette.svg), plus a script that looks colours up. Both read the package, so `just update` brings in a new ayu release.

## Running it

Needs Node (the LTS from nvm; `.nvmrc` says `lts/*`) and [just](https://github.com/casey/just). Recipes run `npm install` on first use.

```sh
just app            # build and open the page (port 5198)
just dev            # dev server with hot reload
just color …        # look up colours (below)
just update         # move to the latest ayu release
just check          # type-check the page and the script
just clean          # remove dist/ and node_modules/
```

From `~/dotfiles`, `just ayu-colors` opens the page and `just ayu …` runs the lookup.

## The page

One column per theme, on that theme's `surface.base`. Palette hues show steps L1 (darkest) to L5; a dot marks a step that other tokens use. Click any swatch to copy it as HEX, RGB or its path (`dark.syntax.keyword`); pick which at the top right. Hovering shows the hex and rgb values, which tokens use a palette step, and which palette step a token is. The filter (`/`) matches names (`selection`, `terminal.bright`) and hex values (`ff8f`), and outlines the matching swatches.

## The lookup script

`scripts/ayu-color.ts`, run by Node directly (no build step):

```sh
just color dark syntax.keyword        # #ff8f40
just color mirage terminal            # every colour in a group
just color all editor.bg              # light, mirage and dark side by side
just color find ff8f40                # which tokens have this colour (or the nearest)
just color -f rgb dark editor.selection.active   # rgb(51 136 255 / 0.251)
just color -f json light blue.l3
just color paths                      # every path
```

Paths are dotted and case-insensitive, and palette hues can skip `palette.` (`blue.l3`). A single colour prints only the hex, so `$(just color dark ui.bg)` works in scripts. In a terminal, lists show a colour block next to each value (`--no-swatch` or `NO_COLOR` turns it off).

The Claude skill in `~/dotfiles/.claude/skills/ayu-color` tells Claude to use this script instead of guessing ayu hex values.

## Code

- `src/lib/ayu.ts`: shared by both: walks the package's schemes, looks up paths, finds which tokens use a colour
- `src/main.ts`, `src/styles.css`: the page
- `scripts/ayu-color.ts`: the CLI
