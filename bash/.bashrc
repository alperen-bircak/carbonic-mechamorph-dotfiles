#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias fetch='fastfetch'
PS1='[\u@\h \W]\$ '
export PATH="$HOME/.local/bin:$PATH"

# nnn file manager: `n` opens it and cds the shell to where you quit (q)
[ -f /usr/share/nnn/quitcd/quitcd.bash_sh_zsh ] && . /usr/share/nnn/quitcd/quitcd.bash_sh_zsh
# Show hidden files and folders by default (`.` toggles them in nnn)
export NNN_OPTS="H"

# nvm (Node version manager, installed in ~/.nvm); default is the Node LTS
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && . "$NVM_DIR/bash_completion"
