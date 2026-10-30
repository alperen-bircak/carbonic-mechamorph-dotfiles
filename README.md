# dotfiles

Configs for my Arch + sway setup, linked into `~` with [GNU Stow](https://www.gnu.org/software/stow/).

Each top-level folder is a stow package laid out like `~`. For example, `sway/.config/sway/config` is linked to `~/.config/sway/config`. Edit the files here; the symlinks make the programs pick up the changes.

| Package | Contents |
|---|---|
| `sway` | sway config |
| `bash` | `.bashrc`, `.bash_profile` |
| `bin` | scripts in `~/.local/bin` |
| `gtklock` | lock screen config and style |
| `gtk` | `gtk.css` for GTK3 and GTK4 apps |
| `theme` | each app's theme files, in `~/.config/theme` |
| `tinty` | [tinty](https://github.com/tinted-theming/tinty) config, the custom colour scheme and the templates that generate `theme` |
| `system` | copies of root-owned files, not stowed (see `system/README.md`) |

Run `just` to list the commands. The main ones:

- `just link`: create the symlinks (on a new machine, after cloning)
- `just relink`: refresh the symlinks after adding or removing files
- `just reload`: reload sway
- `just gtk`: apply GTK settings, which live in dconf and can't be symlinked
- `just system`: compare `system/` with the live files
- `just theme-generate`: render the colour scheme into `theme/`, for one app or all
- `just theme-sync`: reload running apps after a theme change
- `just icons-install`: install the Pixelitos icon theme (on a new machine; `just gtk` selects it)
- `just tinty-install`: install tinty and fetch its schemes and templates (only needed for `just theme-generate`, after `just link`)
- `just update-background`: set the lock, login and Plymouth background (give it a PNG, or `--file-picker` to choose one)

## Theme

Apps read their theme from `theme/.config/theme/` (`~/.config/theme`), ordinary files you can edit by hand. Tinty only generates them, and a new machine doesn't need it.

1. **Generate:** edit `tinty/.config/tinted-theming/tinty/schemes/base24/ayu-carbon.yaml` by hand or with `just theme-editor`, then run `just theme-generate`, or `just theme-generate waybar` for one app. It overwrites the files it writes, hand edits included.
2. **Modify:** edit the files in `theme/.config/theme/` if you want.
3. **Sync:** `just theme-sync` reloads running apps. GTK apps, Neovim and foot need a restart.

The login screen isn't part of this: it holds its own hex values (see `THEME_MANIFEST.md`). To theme another app, add an `[[items]]` entry to tinty's `config.toml` and a line to `sources` in the `theme-generate` recipe, then have the app's config read its file from `~/.config/theme`. Apps without a base24 template upstream use `dotfiles-templates/`, next to `config.toml`.

`helpers/` holds small tools that aren't configs and aren't stowed:

- `helpers/bg-maker`: a hex-grid wallpaper maker (React app). `just bg-maker` opens it.
- `helpers/theme-editor`: a base24 scheme editor with presets and app previews (React app). `just theme-editor` opens it.
- `helpers/ayu-colors`: every ayu colour on one page (`just ayu-colors`), and a lookup script (`just ayu dark syntax.keyword`).

`.claude/skills/` holds Claude Code skills for this repo. `ayu-color` makes Claude look up ayu colours with the script above instead of guessing them.

Not tracked: htop, btop, bottom and `mimeapps.list`. Those apps replace their config file when they save, which would break the symlink.
