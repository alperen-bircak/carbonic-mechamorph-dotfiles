# Stow packages that get symlinked into ~
packages := "sway bash bin ghostty"

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

# Apply GTK settings (kept in dconf, so they can't be symlinked)
gtk:
    gsettings set org.gnome.desktop.interface font-name 'Adwaita Sans 9'

# Compare the system/ copies with the live files
system:
    #!/usr/bin/env bash
    cd system
    find . -type f ! -name README.md | sort | while read -r f; do
        live="/${f#./}"
        if diff -q "$f" "$live" >/dev/null; then
            echo "same     $live"
        else
            echo "differs  $live"
            diff -u "$f" "$live"
        fi
    done
