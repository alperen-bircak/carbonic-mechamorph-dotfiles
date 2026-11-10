# Read by greetd when a session starts, so the whole desktop gets these.
# Login shells read ~/.bash_profile instead.

# Qt apps take their colours, icons and font from GTK, so they follow the active theme.
# The plugin comes with Qt itself, for both Qt5 and Qt6.
export QT_QPA_PLATFORMTHEME=gtk3

# Default editor for terminal apps (yazi, git, sudoedit...)
export EDITOR=nvim
export VISUAL=nvim

# Open and save dialogs go through xdg-desktop-portal, whose FileChooser is yazi (see the portal
# package). GTK3 apps and Firefox use the portal with GTK_USE_PORTAL, GTK4 apps with GDK_DEBUG.
export GTK_USE_PORTAL=1
export GDK_DEBUG=portals
