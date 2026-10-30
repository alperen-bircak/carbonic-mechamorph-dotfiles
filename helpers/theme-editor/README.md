# Theme editor

A base24 colour scheme editor for the tinty schemes in this repo. It opens and saves `tinty/.config/tinted-theming/tinty/schemes/base24/*.yaml`, with old and edited colours side by side. Saving doesn't run `tinty apply`.

## Running it

Needs Node (the LTS from nvm; `.nvmrc` says `lts/*`) and [just](https://github.com/casey/just).

```sh
just app     # build and open the app (port 5197)
just dev     # dev server with hot reload
just build   # static build in dist/
just check   # type-check
just clean   # remove dist/ and node_modules/
```

The app needs the Vite server behind it to reach the disk (`server/api.ts`), because Firefox has no file system API. The server listens on 127.0.0.1 only, refuses requests from other sites, and only writes `.yaml` files to the schemes folder. If it's not running, *Open from file* and *Download* still work.

## What it does

**Colours**: every slot by what it's for, grouped into backgrounds, text, accents and bright accents, with Old and New next to each other. The number on each row is its contrast, red when it's too low to read. *Revert* puts a group back, and clicking an Old swatch puts that one colour back.

**Pasting**: click a row and paste. One hex sets the row; `#ff8800`, `ff8800`, `0xff8800`, `#f80` and `color: #ff8800;` all work. A list of hexes fills down from that row. Text with `baseXX:` keys, such as a whole scheme file, sets those slots wherever you paste it.

**Adjust**: shifts a whole group's saturation, lightness or hue in OKLCH, so lowering saturation keeps each colour's lightness. It's one undo step per panel.

**Presets**: Ayu Dark, Mirage and Light from the `ayu` package, three desaturated Carbon starting points, your schemes, and tinty's 600 base24 and base16 schemes. Hover to try one in the preview. *Take* limits a preset to its backgrounds, text or accents. *Compare* makes a preset the Old side instead.

**Preview**: Terminal, GTK, TUI, Qt, Editor and Desktop mock-ups, side by side or alone. They're drawn to follow `THEME_MANIFEST.md`, and the Terminal uses the same slots as tinted-terminal's kitty template; the others are close approximations of how those apps map slots. Hover a row to outline where it's used. Click anything in a preview to jump to its row.

**Saving**: only the values change, so comments, order and spacing stay. The name decides the file, because tinty finds a scheme by file name: a renamed scheme saves as a new file. If the file changed on disk since it was opened, you're asked first. Old stays what you opened, so you can keep comparing after a save. *Back to the saved file* moves it up.

Keys: `Ctrl+S` save, `Ctrl+O` open, `Ctrl+Z` / `Ctrl+Shift+Z` undo and redo, `↑` `↓` `Enter` move between rows, `/` presets, `Esc` back.
