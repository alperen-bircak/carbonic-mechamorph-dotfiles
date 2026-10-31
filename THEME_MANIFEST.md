# Theme manifest

The look every config in this repo aims for. When styling something new, or restyling something old, follow these rules. They apply to both themes, [Ayu Carbon and Ayu Light](#themes); where a rule names a dark colour or file, Ayu Light uses its counterpart.

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
10. **Dark by default, light by choice.** Ayu Carbon is the default. `theme-switch` sets `color-scheme` (read through xdg-desktop-portal by GTK4, libadwaita, browsers and Electron apps) and `gtk-theme` (for GTK3 apps, which ignore `color-scheme`) from the active theme's `theme.env`.
11. **Fira Code.** The UI font is Fira Code. Terminals use FiraCode Nerd Font Mono (the Nerd Font build, for icons; package `ttf-firacode-nerd`).
12. **Lock screen and display manager are centered rectangles.** gtklock and nwg-hello show one solid rectangle in the middle of the screen, over the wallpaper, holding the clock and the password box (and the session/user pickers on the greeter). Both stay Ayu Carbon whatever the desktop's theme is.
13. **Neovim is standard ayu.** It uses neovim-ayu's `ayu-dark` or `ayu-light` (`NVIM_COLORSCHEME` in `theme.env`) with no colour changes, not Ayu Carbon. The terminal switches to Neovim's background while Neovim runs.
14. **Pixelitos icons.** The icon theme is [pixelitos-icon-theme](https://github.com/ItsZariep/pixelitos-icon-theme), `pixelitos-dark` or `pixelitos-light`. `just icons-install` installs both and adds aliases for names they lack, pointing them at their own icons (`aliases` in that recipe: kitty, bluetooth, sound, wifi, brightness and so on). `theme.env` selects one for GTK, and rofi's comes from `rofi-config.rasi`.
15. **Bibata Original cursors.** Ayu Carbon uses `Bibata-Original-Classic` and Ayu Light `Bibata-Original-Ice`, both 28px, set in each theme's `desktop.conf`. `just cursor-install` installs both.

## Themes

Each theme is a folder in `theme/.config/themes/` (`~/.config/themes`), and neither reads from the other, so changing one leaves the other alone. `~/.config/theme` is a symlink to the active one. It isn't in the repo: `theme-switch` changes it, and `just link` creates it on a new machine. Apps only read `~/.config/theme`, except the lock screen, which names `ayu-carbon`.

- **Switching:** click the moon or sun in waybar, use the Super Menu's Settings, or run `theme-switch [toggle|dark|light|THEME]`. It needs nothing beyond what the desktop already runs: no tinty, just or daemon.
- **`theme.env`:** hand-written; the colour scheme, GTK theme, icons, Neovim colorscheme, fzf colours and waybar icon. Generating leaves it alone.
- **`desktop.conf`:** hand-written; the wallpaper and cursor, included by the sway config. Generating leaves it alone.
- **What restarts:** sway, waybar, mako, kitty, swayosd, polkit-gnome and the file picker follow at once, and so do running Neovims. Open GTK and Qt apps, foot and open shells pick the new theme up when next started, because GTK reads `gtk.css` only at startup.
- **Why `gtk.css` stays:** it has to load as a user stylesheet, which outranks Adwaita and apps' own CSS. As a named GTK theme, rules like `* { border-radius: 0 }` would lose to Adwaita's.
- **Qt:** `QT_QPA_PLATFORMTHEME=gtk3` in `.profile`, so Qt apps take their colours, icons and font from GTK. The plugin comes with Qt, and greetd reads `.profile`.
- **The lock screen:** `bin/.local/bin/lock` runs gtklock with `XDG_CONFIG_HOME` set to `~/.config/gtklock` and the keyfile GSettings backend, so neither the active `gtk.css` nor the desktop's settings reach it. Its `gtk-3.0/gtk.css` and `glib-2.0/settings/keyfile` hold the Ayu Carbon versions. Always lock through this script.

## Ayu Carbon

Ayu Carbon is a base24 scheme, in `tinty/.config/tinted-theming/tinty/schemes/base24/ayu-carbon.yaml`. [Tinty](https://github.com/tinted-theming/tinty) generates a starting theme for each app from it. Those themes are ordinary files in `theme/.config/themes/ayu-carbon/`; apps read them from there and never read tinty's own folder, so tinty isn't needed to run the desktop.

- **What it changes:** ayu dark's backgrounds are blue-tinted; Ayu Carbon desaturates them. Text, syntax and accent colours stay as ayu dark has them.
- **The flow:** `just theme-generate` renders the scheme into the repo, you edit the results if you want, and `just theme-sync` reloads the apps.
- **Changing colours:** for every app, edit the scheme, then generate and sync. For one app, edit its file in the theme's folder and sync. Keep colours in those files, not in app configs. Scripts get theirs from `colors.sh`.
- **Keeping hand edits:** generating overwrites the files it writes, so `just theme-generate waybar` regenerates one app and leaves the rest alone.
- **Adding an app:** add an `[[items]]` entry to tinty's `config.toml` and a line to `sources` in the `theme-generate` recipe, generate both themes, and have the app's config read its file from `~/.config/theme`. The upstream repo has to render base24: the older `base16-*` ones (waybar, rofi, mako) don't, so those apps use `dotfiles-templates/`, next to `config.toml`. Add a template there when an app has no base24 one, and pick colours by scheme slot, as in the palette below.
- **The login screen can't follow the scheme:** nwg-hello runs as the greeter user, who can't read `~/.config/theme`, so `system/etc/nwg-hello/nwg-hello.css` holds the hex values. Update it by hand after changing the scheme.
- **Where tinty renders:** `just theme-generate` copies `dotfiles-templates/` to tinty's data folder and renders there, then copies only the finished files into the theme's folder. Don't stow into tinty's data folder.

## Ayu Light

Ayu Light is plain ayu light from the palette v9.1.0, with no desaturating, in `schemes/base24/ayu-light-v9.yaml`. Its slug has the `-v9` because tinty ships an older `ayu-light`. Generate it with `just theme-generate all ayu-light-v9`, or `just theme-generate waybar ayu-light-v9` for one app. It has no `gtklock.css`. Its wallpaper is `wallpaper.png` in the theme's folder, a light take on Ayu Carbon's hex grid from bg-maker, with its settings in `wallpaper-preset.json`. Change it with `update-background --light`.

Look its colours up with `just ayu light <token>`. The slots keep their roles, so `base00` is the main background and `base05` the main text. Ayu light's bright terminal colours are the same as its normal ones.

## Out of scope

For now we don't theme things we rarely see, such as the TTY console and htop. They keep their defaults. btop keeps its own config, which can't be symlinked: `color_theme = "TTY"` and `theme_background = False` make it follow the terminal in both themes.

Firefox isn't themed either: its default themes are fine, and it follows `color-scheme` when set to Automatic.

## Sway window borders

Sway is where a border is needed: it's the only sign of which window has focus.

- **Unfocused:** the subtle gray (`ui.line`).
- **Focused:** the stronger gray (`ui.fg`).
- **Split indicator:** the indigo accent, so you can see where the next window will open.

## Palette

| Use | Scheme slot | ayu token | Ayu Carbon | Ayu Light |
|---|---|---|---|---|
| Outer background (bars, outer areas) | `base10` | `ui.bg` | `#101010` | `#f8f9fa` |
| Main background (windows, editors) | `base00` | `editor.bg` | `#121212` | `#fcfcfc` |
| Raised background (panels, popups, the lock box) | `base01` | `ui.panel.bg` | `#181818` | `#fafafa` |
| Thin borders, dividers, unfocused sway border | `base02` | `ui.line` (flattened in light) | `#1f1f1f` | `#e7eaed` |
| Muted text, inactive items, focused sway border | `base03` | `ui.fg` | `#636363` | `#828e9f` |
| Main text | `base05` | `editor.fg` | `#bdbdbd` | `#5c6166` |
| Accent (split indicator, the one active item) | `base0D` | `palette.indigo.l2` | `#39bae6` | `#4ca3c1` |
| Errors | `base0F` | `common.error` | `#d95757` | `#e65050` |

The hex values are the current scheme.

Use the accent sparingly: one focused or active thing at a time. Ayu's own yellow accent (`common.accent.tint`) is not used.

## Not there yet

These still break the rules above, because the app doesn't let them be changed from a config:

- Loupe paints the area around an image `#222226` itself, so CSS can't reach it. Its headerbar and buttons do follow the scheme.
- Pixelitos doesn't cover every icon. Symbolic icons with no alias, like the arrows in GTK toolbars, still come from Adwaita, and some apps show their own icon from hicolor.
- The login screen can't use the Pixelitos theme: the greeter user can't read `~/.local/share/icons`. Its three power buttons are Pixelitos anyway, from SVG copies in `system/usr/share/nwg-hello/`; everything else there stays Adwaita.
- Qt apps use the Fusion style, which draws its own widgets, so they may keep slight rounding.
- Pixelitos light has fewer icons than dark, and its `index.theme` inherits `breeze-dark`, which isn't installed. Icons it lacks fall back to hicolor.
- Ayu Light's accent on white text is low contrast, and so is the white cursor on light backgrounds.
