-- auto-save: write files as you edit, so closing the terminal never loses work
-- (kitty.conf doesn't ask before closing). Default settings; :ASToggle turns
-- it off/on.
vim.pack.add({ 'https://github.com/okuuva/auto-save.nvim' })

require('auto-save').setup()
