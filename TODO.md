# TODO

- [ ] Rethink the shell: currently bash (login shell `/usr/bin/bash`, `bash` stow package); zsh isn't installed
  - Decide whether to stay on bash or move to zsh/fish/something else
- [ ] Style Plymouth: currently the custom `black` theme (`system/usr/share/plymouth/themes/black/`, `Theme=black` in `system/etc/plymouth/plymouthd.conf`), a plain black screen
  - Make it match the desktop, e.g. the hex wallpaper (`/usr/local/share/backgrounds/hex.png`) and ayu colours
  - After changing it, rebuild the initramfs and update the `system/` copies and README table
- [ ] Theme leftovers (the rest is done; see `THEME_MANIFEST.md`)
  - Wallpaper `hex.png` (bg-maker): its tones are close to `base01`, so the lock and login rectangles barely stand out; regenerate it darker, or try `base00` for the box
  - Cursor theme: Adwaita, optional
  - Skip: systemd-boot (not themeable), ly (disabled), Qt (no Qt apps)
