# System files

Copies of files outside `~`. They're owned by root, so they aren't symlinked. Each one lives at the same path under `/`, so `system/etc/makepkg.conf` is `/etc/makepkg.conf`.

Run `just system` to see whether the live files still match these copies.

| File | What changed from the default |
|---|---|
| `boot/loader/entries/arch.conf` | `quiet loglevel=3 systemd.show_status=auto rd.udev.log_level=3` to hide boot messages |
| `boot/loader/loader.conf` | `timeout 0` to skip the boot menu (hold Space at boot to show it) |
| `etc/makepkg.conf` | `!debug` in `OPTIONS` so AUR builds don't make `-debug` packages |

To restore one, copy it back as root, for example `run0 cp system/etc/makepkg.conf /etc/makepkg.conf`.
