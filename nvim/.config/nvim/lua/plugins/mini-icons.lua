-- mini.icons: file-type and keymap icons for other plugins (which-key uses it,
-- nvim-tree goes through the nvim-web-devicons mock).
-- Glyphs come from ttf-nerd-fonts-symbols, which kitty falls back to.
vim.pack.add({ 'https://github.com/nvim-mini/mini.icons' })

local icons = require('mini.icons')
icons.setup()
icons.mock_nvim_web_devicons()
