# Theme manifest

The look every config in this repo aims for. When styling something new, or restyling something old, follow these rules.

## Ideals

1. **Ayu Carbon based.** The theme is Ayu Carbon: ayu dark with desaturated backgrounds (see [Ayu Carbon](#ayu-carbon)). All other colours come from the ayu dark palette, not from guesses or other themes. Look them up with `just ayu dark <token>` (or `just ayu-colors` to see them all).
2. **Tinty, then premade themes.** If tinty has a template for an app, generate the app's theme with it, so it starts from the Ayu Carbon scheme. Otherwise, for now, if the app has a ready-made ayu dark theme (built in, or published by the theme or app authors), use that instead of styling the app by hand. If either breaks any rule below (rounded corners, transparency, extra borders and so on), copy it into this repo and change it to follow the rules. Hand-style only apps that have neither.
3. **No borders by default.** Separate things with background shades and spacing, not lines.
4. **Thin grayish borders when needed.** If a border is the only way to show an edge or focus, keep it 1–2 px and gray (`ui.line`, or `ui.fg` for something that must stand out). No bright or coloured outlines.
5. **Rectangular containers.** Boxes, panels, bars, menus and input fields are plain rectangles.
6. **Zero border radius.** No rounded corners anywhere: `border-radius: 0`.
7. **No transparency.** Backgrounds are solid colours. No `rgba` backgrounds, no blur, no see-through panels.
8. **Minimalistic.** Show only what's needed. No shadows, gradients, icons for decoration or extra labels.
9. **Indigo accent, only when needed.** The accent is ayu dark's indigo. Most things need no accent at all.
10. **Prefer dark.** For now, everything defaults to dark. The `gtk` recipe sets `color-scheme` to `prefer-dark` (read through xdg-desktop-portal by GTK4, libadwaita, browsers and Electron apps) and `gtk-theme` to `Adwaita-dark` (for GTK3 apps, which ignore `color-scheme`).
11. **Fira Code.** The UI font is Fira Code. Terminals use FiraCode Nerd Font Mono (the Nerd Font build, for icons; package `ttf-firacode-nerd`).
12. **Lock screen and display manager are centered rectangles.** gtklock and nwg-hello show one solid rectangle in the middle of the screen, over the wallpaper, holding the clock and the password box (and the session/user pickers on the greeter).
13. **Neovim is standard ayu dark.** It uses neovim-ayu's `ayu-dark` with no colour changes, not Ayu Carbon. The terminal switches to Neovim's background while Neovim runs.
14. **Pixelitos icons.** The icon theme is the dark version of [pixelitos-icon-theme](https://github.com/ItsZariep/pixelitos-icon-theme), `pixelitos-dark`. `just icons-install` installs it and adds aliases for names it lacks, pointing them at its own icons (`aliases` in that recipe: kitty, bluetooth, sound, wifi, brightness and so on). The `gtk` recipe selects it, and rofi names it in its own config.

## Ayu Carbon

Ayu Carbon is a base24 scheme, in `tinty/.config/tinted-theming/tinty/schemes/base24/ayu-carbon.yaml`. [Tinty](https://github.com/tinted-theming/tinty) generates a starting theme for each app from it. Those themes are ordinary files in `theme/.config/theme/` (`~/.config/theme`); apps read them from there and never read tinty's own folder, so tinty isn't needed to run the desktop.

- **What it changes:** ayu dark's backgrounds are blue-tinted; Ayu Carbon desaturates them. Text, syntax and accent colours stay as ayu dark has them.
- **The flow:** `just theme-generate` renders the scheme into the repo, you edit the results if you want, and `just theme-sync` reloads the apps.
- **Changing colours:** for every app, edit the scheme, then generate and sync. For one app, edit its file in `theme/.config/theme/` and sync. Keep colours in those files, not in app configs.
- **Keeping hand edits:** generating overwrites the files it writes, so `just theme-generate waybar` regenerates one app and leaves the rest alone.
- **Adding an app:** add an `[[items]]` entry to tinty's `config.toml` and a line to `sources` in the `theme-generate` recipe, and have the app's config read its file from `~/.config/theme`. The upstream repo has to render base24: the older `base16-*` ones (waybar, rofi, mako) don't, so those apps use `dotfiles-templates/`, next to `config.toml`. Add a template there when an app has no base24 one, and pick colours by scheme slot, as in the palette below.
- **The login screen can't follow the scheme:** nwg-hello runs as the greeter user, who can't read `~/.config/theme`, so `system/etc/nwg-hello/nwg-hello.css` holds the hex values. Update it by hand after changing the scheme.
- **Where tinty renders:** `just theme-generate` copies `dotfiles-templates/` to tinty's data folder and renders there, then copies only the finished files into `theme/.config/theme/`. Don't stow into tinty's data folder.

## Out of scope

For now we don't theme things we rarely see, such as the TTY console and htop. They keep their defaults.

Firefox isn't themed either: its default dark theme is fine.

## Sway window borders

Sway is where a border is needed: it's the only sign of which window has focus.

- **Unfocused:** darker gray (`ui.line`).
- **Focused:** lighter gray (`ui.fg`).
- **Split indicator:** the indigo accent, so you can see where the next window will open.

## Palette

| Use | Scheme slot | ayu token | Hex |
|---|---|---|---|
| Darkest background (bars, outer areas) | `base10` | `ui.bg` | `#101010` |
| Main background (windows, editors) | `base00` | `editor.bg` | `#121212` |
| Raised background (panels, popups, the lock box) | `base01` | `ui.panel.bg` | `#181818` |
| Thin borders, dividers, unfocused sway border | `base02` | `ui.line` | `#1f1f1f` |
| Muted text, inactive items, focused sway border | `base03` | `ui.fg` | `#636363` |
| Main text | `base05` | `editor.fg` | `#bdbdbd` |
| Accent (split indicator, the one active item) | `base0D` | `palette.indigo.l2` (= `syntax.tag`) | `#39bae6` |
| Errors | `base0F` | `common.error` | `#d95757` |

The hex values are the current scheme.

Use the accent sparingly: one focused or active thing at a time. Ayu's own yellow accent (`common.accent.tint`) is not used.

## Not there yet

These still break the rules above, because the app doesn't let them be changed from a config:

- Loupe paints the area around an image `#222226` itself, so CSS can't reach it. Its headerbar and buttons do follow the scheme.
- Pixelitos doesn't cover every icon. Symbolic icons with no alias, like the arrows in GTK toolbars, still come from Adwaita, and some apps show their own icon from hicolor.
- The login screen keeps Adwaita icons: the greeter user can't read `~/.local/share/icons`.
