# System files

Copies of files outside `~`. They're owned by root, so they aren't symlinked. Each one lives at the same path under `/`, so `system/etc/makepkg.conf` is `/etc/makepkg.conf`.

Run `just system` to see whether the live files still match these copies.

| File | What changed from the default |
|---|---|
| `boot/loader/entries/arch.conf` | `quiet loglevel=3 systemd.show_status=auto rd.udev.log_level=3` to hide boot messages; `splash` to start Plymouth; `mem_sleep_default=deep` so suspend uses S3, which drains far less than s2idle |
| `boot/loader/loader.conf` | `timeout 0` to skip the boot menu (hold Space at boot to show it) |
| `etc/systemd/system/ly@.service.d/exit-status.conf` | `SuccessExitStatus=15` because ly exits with 15 when stopped, which systemd counted as a failure at every shutdown |
| `etc/mkinitcpio.conf` | `plymouth` in `HOOKS` so the splash starts early in boot |
| `etc/plymouth/plymouthd.conf` | `Theme=black` |
| `usr/share/plymouth/themes/black/` | Custom Plymouth theme: a plain black screen at boot and shutdown, covering all console text |
| `etc/makepkg.conf` | `!debug` in `OPTIONS` so AUR builds don't make `-debug` packages |
| `etc/greetd/config.toml` | Login screen: greetd runs nwg-hello inside sway, using `etc/greetd/sway-config` (greetd replaced ly; enabled with `systemctl enable greetd`) |
| `etc/greetd/sway-config` | New file: sway config for the login screen, with the desktop's `tr` keyboard layout and `eDP-1` scale 1.8 |
| `etc/polkit-1/rules.d/49-run0-grace.rules` | New file: like sudo's timestamp, run0 skips the password for 15 minutes in a terminal where `run0k` (the `bin` package's wrapper) last succeeded, using a file at `/run/run0-grace/<terminal id>`. Applies to wheel users in a local, active session only |
| `usr/local/bin/run0-terminal` | New file: prints the terminal ID that the run0 rule and `run0k` use: the tty and session of the nearest parent process that has a terminal |
| `etc/nwg-hello/nwg-hello.css` | New file: the default nwg-hello style with the background set to the desktop wallpaper (`Sway_Wallpaper_Blue_1920x1080.png`) |

Enabled services that don't come with a file here:

- `swayosd-libinput-backend` (`systemctl enable --now swayosd-libinput-backend`): lets swayosd show Caps Lock and Num Lock popups. It runs as root because it reads the keyboard through libinput

To restore one, copy it back as root, for example `run0 cp system/etc/makepkg.conf /etc/makepkg.conf`.
