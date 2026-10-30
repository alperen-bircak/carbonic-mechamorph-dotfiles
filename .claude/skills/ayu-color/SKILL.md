---
name: ayu-color
description: Look up exact ayu theme colours (light, mirage, dark) from the official `ayu` npm package instead of guessing hex values. Use whenever a config, theme, stylesheet or script needs an ayu colour — e.g. styling sway, waybar, rofi, mako, gtklock, kitty or nvim — or when asked "what's the ayu X colour", or to find which ayu token a hex value is.
---

# ayu colours

The user's setup is themed with ayu v9. Get colours from the `ayu` npm package
through the lookup script in `~/dotfiles/helpers/ayu-colors`; never write ayu
hex values from memory.

## Command

```sh
just -f ~/dotfiles/helpers/ayu-colors/justfile color <args>
```

(From inside `~/dotfiles`, `just ayu <args>` is the same thing.) The first run
installs the npm dependencies, which takes a few seconds.

| Args | Prints |
|---|---|
| `dark syntax.keyword` | one colour: `#ff8f40` |
| `mirage terminal` | every colour in a group, one `path  hex` per line |
| `all editor.bg` | the colour in light, mirage and dark |
| `all syntax` | a group as a table, one column per theme |
| `find ff8f40` | which tokens have that colour (nearest ones if none match exactly) |
| `find '#59c2ff' dark` | the same, in one theme |
| `paths` | every path |

Options: `--format rgb` (`rgb(255 143 64)`), `--format json`. A single colour
prints just the hex, so `$(just -f … color dark ui.bg)` works in scripts. An
unknown path exits 1 and suggests close matches.

## Paths

Dotted and case-insensitive. Themes: `light`, `mirage`, `dark` (`all` for all three).

- `palette.<hue>.l1`…`l5`, hues: gray red pink orange peach yellow green teal indigo blue purple. L1 is darkest. The `palette.` prefix is optional: `blue.l3`.
- `syntax.`: tag func entity string regexp markup keyword special comment constant operator
- `terminal.`: black red green yellow blue magenta cyan white, and `bright*` of each
- `vcs.`: added modified removed
- `surface.`: sunk base lift over
- `editor.`: fg bg line selection.active selection.inactive findMatch.active findMatch.inactive lineNumber.active lineNumber.normal indentGuide.active indentGuide.normal
- `ui.`: fg bg line selection.active selection.normal panel.bg panel.shadow popup.bg popup.shadow
- `common.`: accent.tint accent.on error

Run `paths` if one isn't here: the list comes from the installed package.

## Notes

- Some colours have alpha and print as 8-digit hex (`#3388ff40`). If the target
  doesn't support alpha (many configs don't), say so and either use `--format rgb`
  where `rgba` works, or ask which background to blend it onto.
- Prefer semantic tokens (`ui.bg`, `syntax.keyword`, `vcs.added`, `common.accent.tint`)
  over raw palette steps when one fits what the colour is for.
- The user can browse every colour with `just ayu-colors` (a page in the browser).
