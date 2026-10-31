#
# ~/.zshrc
#

alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias fetch='fastfetch'
eval "$(starship init zsh)"
# Starship's timer can't depend on the result, so drop the duration of commands that worked
_starship_hide_duration() { [[ ${STARSHIP_CMD_STATUS:-0} == 0 ]] && unset STARSHIP_DURATION }
add-zsh-hook precmd _starship_hide_duration
export PATH="$HOME/.local/bin:$PATH"
export PATH="$HOME/.dotnet/tools:$PATH"

# Unlike bash, zsh keeps no history file unless told to. Autosuggestions read from it.
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt share_history hist_ignore_all_dups

# Behave like bash: allow # comments at the prompt, pass unmatched globs through as they are
setopt interactive_comments
unsetopt nomatch

# Emacs keys, or zsh picks vi keys when $EDITOR is nvim. Home, End, Delete and
# Ctrl+arrows aren't bound by default.
bindkey -e
bindkey '^[[H' beginning-of-line
bindkey '^[[F' end-of-line
bindkey '^[[3~' delete-char
bindkey '^[[1;5D' backward-word
bindkey '^[[1;5C' forward-word

# Tab completion: pick from a menu, ignoring case
autoload -Uz compinit && compinit
zstyle ':completion:*' menu select
zstyle ':completion:*' matcher-list 'm:{a-zA-Z}={A-Za-z}'

# fzf's colours follow the active theme
. ~/.config/theme/theme.env
export FZF_DEFAULT_OPTS="--color=$FZF_COLORS"

# nnn file manager: `n` opens it and cds the shell to where you quit (q)
[ -f /usr/share/nnn/quitcd/quitcd.bash_sh_zsh ] && . /usr/share/nnn/quitcd/quitcd.bash_sh_zsh
# Show hidden files and folders by default (`.` toggles them in nnn)
export NNN_OPTS="H"

# nvm (Node version manager, installed in ~/.nvm); default is the Node LTS
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"

# Grey suggestions from history (right arrow accepts), and colours while typing.
# zsh-syntax-highlighting has to be sourced last.
. /usr/share/zsh/plugins/zsh-autosuggestions/zsh-autosuggestions.zsh
. /usr/share/zsh/plugins/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh
