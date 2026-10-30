# Stow packages that get symlinked into ~
packages := "sway bash bin ghostty kitty foot gtk mako gtklock rofi waybar bluetui wlctl wiremix swayosd nvim tinty theme"

# List recipes
default:
    @just --list

# Symlink all packages into ~
link:
    stow -v -t ~ {{packages}}

# Remove the symlinks from ~
unlink:
    stow -v -D -t ~ {{packages}}

# Re-link after adding or removing files in a package
relink:
    stow -v -R -t ~ {{packages}}

# Reload the sway config
reload:
    swaymsg reload

# Apply GTK and Blueman settings (kept in dconf, so they can't be symlinked)
gtk:
    # color-scheme is what GTK4, libadwaita, browsers and Electron read through
    # xdg-desktop-portal; GTK3 ignores it and needs gtk-theme
    gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'
    gsettings set org.gnome.desktop.interface gtk-theme 'Adwaita-dark'
    gsettings set org.gnome.desktop.interface font-name 'Fira Code 10'
    gsettings set org.gnome.desktop.interface document-font-name 'Fira Code 10'
    gsettings set org.gnome.desktop.interface monospace-font-name 'FiraCode Nerd Font Mono 10'
    gsettings set org.gnome.desktop.interface icon-theme 'pixelitos-dark'
    gsettings set org.gnome.desktop.interface cursor-theme 'Bibata-Original-Classic'
    gsettings set org.gnome.desktop.interface cursor-size 28
    # No Blueman tray icon (waybar's bluetooth module opens blueman-manager);
    # ShowConnected needs StatusIcon, so it goes too
    gsettings set org.blueman.general plugin-list "['!StatusIcon', '!ShowConnected']"

# Only `just theme-generate` needs tinty. It isn't in pacman, so this takes the release binary.
# The repo only holds the 16px icons; releases also have the 128px set.
# Install the Pixelitos dark icon theme into ~/.local/share/icons
icons-install version="20261026" sha256="2ba74b1d3d9583650fda30939ff7e464fad7f983fca9c43eca08c817f8872ebb":
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    cd "$tmp"
    name=pixelitos-icon-theme
    curl -fsSLO "https://github.com/ItsZariep/$name/releases/download/{{version}}/$name.tar.gz"
    echo "{{sha256}}  $name.tar.gz" | sha256sum -c
    tar xzf "$name.tar.gz"
    icons=${XDG_DATA_HOME:-$HOME/.local/share}/icons
    mkdir -p "$icons"
    rm -rf "$icons/pixelitos-dark"
    cp -r "$name/pixelitos-dark" "$icons/"
    # Names the theme lacks, and the icon of its own that stands in for each
    declare -A aliases=(
        [kitty]=apps/utilities-terminal
        [bluetooth-active-symbolic]=devices/bluetooth
        [audio-volume-high-symbolic]=symbolic/audio-volume-high
        [sink-volume-overamplified-symbolic]=symbolic/audio-volume-high
        [sink-volume-high-symbolic]=symbolic/audio-volume-high
        [sink-volume-medium-symbolic]=symbolic/audio-volume-medium
        [sink-volume-low-symbolic]=symbolic/audio-volume-low
        [sink-volume-muted-symbolic]=symbolic/notification-audio-volume-muted
        [network-wireless-symbolic]=symbolic/notification-network-wireless
        [display-brightness-symbolic]=apps/preferences-desktop-display-nightcolor
        [battery-symbolic]=devices/battery
        [drive-harddisk-symbolic]=devices/drive-harddisk
        [preferences-desktop-wallpaper-symbolic]=apps/preferences-desktop-wallpaper
        [changes-allow-symbolic]=emblems/emblem-unlocked
        [preferences-system-symbolic]=apps/preferences-system
    )
    for name in "${!aliases[@]}"; do
        for size in 16 128; do
            ln -s "../${aliases[$name]}.png" "$icons/pixelitos-dark/$size/symbolic/$name.png"
        done
    done
    gtk-update-icon-cache -fq "$icons/pixelitos-dark"

# Install the Bibata Original Classic cursor theme into ~/.local/share/icons
cursor-install version="2.0.7" sha256="158b2e7e1b7f6d0eec1af80a93172960dd083b652fef7589575ee984673cc468":
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    cd "$tmp"
    name=Bibata-Original-Classic
    curl -fsSLO "https://github.com/ful1e5/Bibata_Cursor/releases/download/v{{version}}/$name.tar.xz"
    echo "{{sha256}}  $name.tar.xz" | sha256sum -c
    tar xJf "$name.tar.xz"
    icons=${XDG_DATA_HOME:-$HOME/.local/share}/icons
    mkdir -p "$icons"
    rm -rf "$icons/$name"
    cp -r "$name" "$icons/"

# Install tinty and fetch its schemes and templates (after `just link`)
tinty-install version="0.35.0":
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    cd "$tmp"
    name=tinty-x86_64-unknown-linux-gnu
    url=https://github.com/tinted-theming/tinty/releases/download/v{{version}}
    curl -fsSLO "$url/$name.tar.gz"
    curl -fsSLO "$url/$name.sha256"
    sha256sum -c "$name.sha256"
    tar xzf "$name.tar.gz" tinty
    install -m755 tinty ~/.local/bin/tinty
    # tinty refuses to run while a local `path` in its config is missing: the ghostty
    # and foot items point at this clone, the others at the templates copy
    repo=${XDG_DATA_HOME:-$HOME/.local/share}/tinted-theming/tinty/repos/tinted-terminal
    [ -d "$repo" ] || git clone https://github.com/tinted-theming/tinted-terminal "$repo"
    cd {{justfile_directory()}}
    just _tinty-templates
    ~/.local/bin/tinty sync

# Tinty renders into the folder holding the templates, so they're copied out of the repo
_tinty-templates:
    #!/usr/bin/env bash
    set -euo pipefail
    # Not `tinty config --data-dir-path`: it fails until this copy exists
    data=${XDG_DATA_HOME:-$HOME/.local/share}/tinted-theming/tinty
    mkdir -p "$data"
    rm -rf "$data/dotfiles-templates"
    cp -rL tinty/.config/tinted-theming/tinty/dotfiles-templates "$data/dotfiles-templates"

# `tinty install` links any new [[items]] without touching the network.
# Render the scheme into theme/.config/theme, for one app or all, e.g. `just theme-generate waybar`
theme-generate app="all": _tinty-templates
    #!/usr/bin/env bash
    set -euo pipefail
    # Each app's file in the repo, and the tinty output it starts from
    declare -A sources=(
        [kitty.conf]=tinted-terminal-themes-kitty-file.conf
        [ghostty]=tinted-terminal-ghostty-themes-ghostty-file
        [foot.ini]=tinted-terminal-foot-themes-foot-file.ini
        [sway.conf]=dotfiles-sway-themes-sway-file.conf
        [swaynag.conf]=dotfiles-swaynag-themes-swaynag-file.conf
        [rofi.rasi]=dotfiles-rofi-themes-rofi-file.rasi
        [mako.conf]=dotfiles-mako-themes-mako-file.conf
        [waybar.css]=dotfiles-css-themes-css-file.css
        [swayosd.css]=dotfiles-css-themes-css-file.css
        [gtklock.css]=dotfiles-css-themes-css-file.css
        [gtk3.css]=dotfiles-css-themes-css-file.css
        [gtk4.css]=dotfiles-css-themes-css-file.css
    )
    dir=theme/.config/theme
    files=()
    for file in "${!sources[@]}"; do
        [ "{{app}}" = all ] || [ "{{app}}" = "${file%.*}" ] && files+=("$file")
    done
    if [ ${#files[@]} -eq 0 ]; then
        echo "no such app: {{app}}; pick one of:" "${!sources[@]}" >&2
        exit 1
    fi
    tinty install -q
    tinty apply base24-ayu-carbon
    data=${XDG_DATA_HOME:-$HOME/.local/share}/tinted-theming/tinty
    mkdir -p "$dir"
    for file in "${files[@]}"; do
        cp -L "$data/${sources[$file]}" "$dir/$file"
        echo "generated $dir/$file"
    done

# Configs read theme/.config/theme through symlinks, so there's nothing to copy.
# Reload running apps after a theme change; GTK apps, Neovim and foot need a restart
theme-sync:
    #!/usr/bin/env bash
    stow -R -t ~ theme
    # Also restarts waybar; don't signal it here, it isn't ready for USR2 yet
    swaymsg -q reload
    makoctl reload
    pkill -USR1 -x kitty
    pkill -USR2 -x ghostty
    # swayosd only reads its style at startup
    pkill -x swayosd-server && swaymsg -q exec swayosd-server
    true

# Open the hex background maker (helpers/bg-maker)
bg-maker:
    just -f helpers/bg-maker/justfile app

# Set the lock, login and Plymouth background, e.g. `just update-background ~/bg.png`
[positional-arguments]
update-background *args:
    @bin/.local/bin/update-background "$@"

# Open the base24 theme editor (helpers/theme-editor)
theme-editor:
    just -f helpers/theme-editor/justfile app

# Open the ayu colour palette page (helpers/ayu-colors)
ayu-colors:
    just -f helpers/ayu-colors/justfile app

# Look up an ayu colour, e.g. `just ayu dark syntax.keyword` (`just ayu --help`)
[positional-arguments]
ayu *args:
    @just -f helpers/ayu-colors/justfile color "$@"

# Compare the system/ copies with the live files
system:
    #!/usr/bin/env bash
    cd system
    find . -type f ! -name README.md | sort | while read -r f; do
        live="/${f#./}"
        if [ ! -r "$live" ]; then
            echo "unreadable $live (run as root to compare)"
        elif diff -q "$f" "$live" >/dev/null; then
            echo "same     $live"
        else
            echo "differs  $live"
            diff -u "$f" "$live"
        fi
    done
