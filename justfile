# Stow packages that get symlinked into ~
packages := "sway bash bin ghostty kitty mako gtklock rofi waybar bluetui wlctl wiremix swayosd nvim"

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
    gsettings set org.gnome.desktop.interface font-name 'Adwaita Sans 11'
    # No Blueman tray icon (waybar's bluetooth module opens blueman-manager);
    # ShowConnected needs StatusIcon, so it goes too
    gsettings set org.blueman.general plugin-list "['!StatusIcon', '!ShowConnected']"

# Open the hex background maker (helpers/bg-maker)
bg-maker:
    just -f helpers/bg-maker/justfile app

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
