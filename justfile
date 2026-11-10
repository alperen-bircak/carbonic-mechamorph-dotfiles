# Stow packages that get symlinked into ~. A missing one is skipped: ssh is in .gitignore, so it
# exists only on this machine.
packages := "sway bash zsh starship bin kitty foot gtk mako gtklock rofi waybar bluetui wlctl wiremix swayosd nvim tinty theme applications calcurse yazi fastfetch portal arch-update ssh"

# List recipes
default:
    @just --list

# Symlink all packages into ~, start on Ayu Carbon if no theme is active yet, and link ~/media to the USB mounts
link:
    stow -v -t ~ $(ls -d {{packages}} 2>/dev/null)
    [ -e ~/.config/theme ] || ln -s themes/ayu-carbon ~/.config/theme
    [ -e ~/media ] || [ -L ~/media ] || ln -s /run/media/$USER ~/media

# Remove the symlinks from ~
unlink:
    stow -v -D -t ~ $(ls -d {{packages}} 2>/dev/null)

# Re-link after adding or removing files in a package
relink:
    stow -v -R -t ~ $(ls -d {{packages}} 2>/dev/null)

# Reload the sway config
reload:
    swaymsg reload

# Apply GTK and Blueman settings (kept in dconf, so they can't be symlinked)
gtk:
    gsettings set org.gnome.desktop.interface font-name 'Fira Code 10'
    gsettings set org.gnome.desktop.interface document-font-name 'Fira Code 10'
    gsettings set org.gnome.desktop.interface monospace-font-name 'FiraCode Nerd Font Mono 10'
    # No Blueman tray icon (waybar's bluetooth module opens blueman-manager);
    # ShowConnected needs StatusIcon, so it goes too
    gsettings set org.blueman.general plugin-list "['!StatusIcon', '!ShowConnected']"
    # The colour scheme, GTK theme, icons and cursor come from the active theme
    bin/.local/bin/theme-switch reapply

# Only `just theme-generate` needs tinty. It isn't in pacman, so this takes the release binary.
# The repo only holds the 16px icons; releases also have the 128px set.
# Install the Pixelitos dark and light icon themes into ~/.local/share/icons
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
    variants=(pixelitos-dark pixelitos-light)
    for variant in "${variants[@]}"; do
        rm -rf "${icons:?}/${variant:?}"
        cp -r "$name/$variant" "$icons/"
    done
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
    for variant in "${variants[@]}"; do
        for name in "${!aliases[@]}"; do
            for size in 16 128; do
                link=$icons/$variant/$size/symbolic/$name.png
                [ -e "$link" ] || ln -s "../${aliases[$name]}.png" "$link"
            done
        done
        gtk-update-icon-cache -fq "$icons/$variant"
    done

# Install the Bibata Original Classic and Ice cursor themes into ~/.local/share/icons
cursor-install version="2.0.7":
    #!/usr/bin/env bash
    set -euo pipefail
    tmp=$(mktemp -d)
    trap 'rm -rf "$tmp"' EXIT
    cd "$tmp"
    declare -A sha256=(
        [Bibata-Original-Classic]=158b2e7e1b7f6d0eec1af80a93172960dd083b652fef7589575ee984673cc468
        [Bibata-Original-Ice]=c96ec7515179cadcefa30f7aefd449830e4e0ab878ee13afbc96aa5906692916
    )
    icons=${XDG_DATA_HOME:-$HOME/.local/share}/icons
    mkdir -p "$icons"
    for name in "${!sha256[@]}"; do
        curl -fsSLO "https://github.com/ful1e5/Bibata_Cursor/releases/download/v{{version}}/$name.tar.xz"
        echo "${sha256[$name]}  $name.tar.xz" | sha256sum -c
        tar xJf "$name.tar.xz"
        rm -rf "${icons:?}/${name:?}"
        cp -r "$name" "$icons/"
    done

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
    # tinty refuses to run while a local `path` in its config is missing: the foot
    # item points at this clone, the others at the templates copy
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
# Render a scheme into theme/.config/themes, e.g. `just theme-generate waybar ayu-light-v9`
theme-generate app="all" theme="ayu-carbon": _tinty-templates
    #!/usr/bin/env bash
    set -euo pipefail
    # Each app's file in the repo, and the tinty output it starts from
    declare -A sources=(
        [kitty.conf]=tinted-terminal-themes-kitty-file.conf
        [foot.ini]=tinted-terminal-foot-themes-foot-file.ini
        [sway.conf]=dotfiles-sway-themes-sway-file.conf
        [swaynag.conf]=dotfiles-swaynag-themes-swaynag-file.conf
        [rofi.rasi]=dotfiles-rofi-themes-rofi-file.rasi
        [rofi-config.rasi]=dotfiles-rofi-config-themes-rofi-config-file.rasi
        [colors.sh]=dotfiles-shell-themes-shell-file.sh
        [mako.conf]=dotfiles-mako-themes-mako-file.conf
        [waybar.css]=dotfiles-css-themes-css-file.css
        [waybar-calendar.jsonc]=dotfiles-waybar-calendar-themes-waybar-calendar-file.jsonc
        [swayosd.css]=dotfiles-css-themes-css-file.css
        [gtklock.css]=dotfiles-css-themes-css-file.css
        [gtk3.css]=dotfiles-css-themes-css-file.css
        [gtk4.css]=dotfiles-css-themes-css-file.css
    )
    # The lock screen always uses Ayu Carbon
    [ "{{theme}}" = ayu-carbon ] || unset 'sources[gtklock.css]'
    dir=theme/.config/themes/{{theme}}
    files=()
    for file in "${!sources[@]}"; do
        [ "{{app}}" = all ] || [ "{{app}}" = "${file%.*}" ] && files+=("$file")
    done
    if [ ${#files[@]} -eq 0 ]; then
        echo "no such app: {{app}}; pick one of:" "${!sources[@]}" >&2
        exit 1
    fi
    tinty install -q
    tinty apply base24-{{theme}}
    data=${XDG_DATA_HOME:-$HOME/.local/share}/tinted-theming/tinty
    mkdir -p "$dir"
    for file in "${files[@]}"; do
        cp -L "$data/${sources[$file]}" "$dir/$file"
        echo "generated $dir/$file"
    done

# Configs read ~/.config/theme, a symlink to the active theme, so there's nothing to copy.
# Reload running apps after editing a theme; GTK4 apps and foot need a restart
theme-sync:
    @bin/.local/bin/theme-switch reapply

# Open the hex background maker (helpers/bg-maker)
bg-maker:
    just -f helpers/bg-maker/justfile app

# Set a background, e.g. `just update-background ~/bg.png` or `just update-background --light ~/bg.png`
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
