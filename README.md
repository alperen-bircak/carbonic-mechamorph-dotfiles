# dotfiles

Configs for my Arch + sway setup, linked into `~` with [GNU Stow](https://www.gnu.org/software/stow/).

Each top-level folder is a stow package laid out like `~`. For example, `sway/.config/sway/config` is linked to `~/.config/sway/config`. Edit the files here; the symlinks make the programs pick up the changes.

| Package | Contents |
|---|---|
| `sway` | sway config |
| `bash` | `.bashrc`, `.bash_profile` |
| `bin` | scripts in `~/.local/bin` |
| `system` | copies of root-owned files, not stowed (see `system/README.md`) |

Run `just` to list the commands. The main ones:

- `just link`: create the symlinks (on a new machine, after cloning)
- `just relink`: refresh the symlinks after adding or removing files
- `just reload`: reload sway
- `just gtk`: apply GTK settings, which live in dconf and can't be symlinked
- `just system`: compare `system/` with the live files

Not tracked: htop, btop, bottom and `mimeapps.list`. Those apps replace their config file when they save, which would break the symlink.
