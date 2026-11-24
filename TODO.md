# TODO

- [ ] Rethink the shell: currently bash (login shell `/usr/bin/bash`, `bash` stow package); zsh isn't installed
  - Decide whether to stay on bash or move to zsh/fish/something else
- [ ] Theme leftovers (the rest is done; see `THEME_MANIFEST.md`)
  - Wallpaper `hex.png` (bg-maker): its tones are close to `base01`, so the lock and login rectangles barely stand out; regenerate it darker, or try `base00` for the box
  - Skip: systemd-boot (not themeable), Qt (no Qt apps)
- [ ] yazi: Windows-style "open with" app list in the `O` menu (currently only the built-in openers: `$EDITOR`, `xdg-open`, Reveal)
  - No rofi; keep it inside yazi. The `O` menu only shows openers written in `yazi.toml`, a plugin can't add entries on the fly
  - Preferred: a script (plus a just recipe) that reads which apps declare each file type (`gio mime <type>`) and writes them into `yazi.toml` as `[opener]` entries + `[open] prepend_rules`; rerun after installing apps
  - Add a hand-written "always offer" list for apps that don't declare a type (e.g. Firefox for Markdown, which only lists nvim)
  - Alternatives: a plugin using yazi's key-hint popup (live, but single-key picks, short lists only), or a "Browse apps…" entry that opens fzf in the same terminal (all apps, searchable)
