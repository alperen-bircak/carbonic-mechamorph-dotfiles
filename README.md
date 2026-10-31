# dotfiles

Configs for my Arch + sway setup, linked into `~` with [GNU Stow](https://www.gnu.org/software/stow/).

Each top-level folder is a stow package laid out like `~`. For example, `sway/.config/sway/config` is linked to `~/.config/sway/config`. Edit the files here; the symlinks make the programs pick up the changes.

| Package | Contents |
|---|---|
| `sway` | sway config |
| `bash` | `.bashrc`, `.bash_profile`, `.profile` |
| `zsh` | `.zshrc`, `.zprofile` |
| `starship` | shell prompt config |
| `bin` | scripts in `~/.local/bin` |
| `kitty` | kitty config, the main terminal |
| `foot` | foot config, the backup terminal |
| `gtk` | `gtk.css` for GTK3 and GTK4 apps |
| `mako` | notification config |
| `gtklock` | lock screen config, style and layout |
| `rofi` | launcher config and theme |
| `waybar` | status bar config and style |
| `bluetui` | Bluetooth TUI config |
| `wlctl` | Wi-Fi TUI config |
| `wiremix` | sound TUI config |
| `swayosd` | volume and brightness popup config and style |
| `nvim` | Neovim config |
| `theme` | each theme's files, in `~/.config/themes` |
| `tinty` | [tinty](https://github.com/tinted-theming/tinty) config, the custom colour schemes and the templates that generate `theme` |
| `system` | copies of root-owned files, not stowed (see `system/README.md`) |

Run `just` to list the commands. The main ones:

- `just link`: create the symlinks (on a new machine, after cloning)
- `just relink`: refresh the symlinks after adding or removing files
- `just reload`: reload sway
- `just gtk`: apply GTK settings, which live in dconf and can't be symlinked
- `just system`: compare `system/` with the live files
- `just theme-generate`: render a colour scheme into `theme/`, for one app or all
- `just theme-sync`: reload running apps after editing the active theme
- `just icons-install`: install the Pixelitos icon themes (on a new machine; the active theme selects one)
- `just cursor-install`: install the Bibata Original cursor themes (on a new machine; the active theme selects one)
- `just tinty-install`: install tinty and fetch its schemes and templates (only needed for `just theme-generate`, after `just link`)
- `just update-background`: set the lock, login, Plymouth and Ayu Carbon background, or Ayu Light's with `--light` (give it a PNG, or `--file-picker` to choose one and pick dark or light in rofi)

## Theme

There are two separate themes, Ayu Carbon and Ayu Light, in `theme/.config/themes/`. `~/.config/theme` is a symlink to the active one, and apps read their theme from there, ordinary files you can edit by hand. Tinty only generates them, and a new machine doesn't need it.

Switch with waybar's moon or sun button, the Super Menu's Settings, or `theme-switch [toggle|dark|light]`. Open GTK and Qt apps, foot and open shells need a restart to follow.

1. **Generate:** edit a scheme in `tinty/.config/tinted-theming/tinty/schemes/base24/` by hand or with `just theme-editor`, then run `just theme-generate` for Ayu Carbon or `just theme-generate all ayu-light-v9` for Ayu Light. `just theme-generate waybar` does one app. It overwrites the files it writes, hand edits included.
2. **Modify:** edit the files in the theme's folder if you want. `theme.env` and `desktop.conf` are hand-written, for the settings that aren't colours.
3. **Sync:** `just theme-sync` reloads running apps. GTK apps and foot need a restart.

The login screen isn't part of this: it holds its own hex values, and the lock screen always uses Ayu Carbon (see `THEME_MANIFEST.md`). To theme another app, add an `[[items]]` entry to tinty's `config.toml` and a line to `sources` in the `theme-generate` recipe, generate both themes, then have the app's config read its file from `~/.config/theme`. Apps without a base24 template upstream use `dotfiles-templates/`, next to `config.toml`.

`helpers/` holds small tools that aren't configs and aren't stowed:

- `helpers/bg-maker`: a hex-grid wallpaper maker (React app). `just bg-maker` opens it.
- `helpers/theme-editor`: a base24 scheme editor with presets and app previews (React app). `just theme-editor` opens it.
- `helpers/ayu-colors`: every ayu colour on one page (`just ayu-colors`), and a lookup script (`just ayu dark syntax.keyword`).

`.claude/skills/` holds Claude Code skills for this repo. `ayu-color` makes Claude look up ayu colours with the script above instead of guessing them.

Not tracked: htop, btop, bottom and `mimeapps.list`. Those apps replace their config file when they save, which would break the symlink.
