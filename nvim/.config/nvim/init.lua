-- Neovim config entry point.
--
-- lua/config/   plain Neovim settings (no plugins)
-- lua/plugins/  one file per plugin: installs it with vim.pack, then configures it
-- after/lsp/    per-server overrides on top of nvim-lspconfig's defaults
--
-- Plugins:  :lua vim.pack.update()   update (shows a diff to confirm)
--           :lua vim.pack.del({ 'name' })   remove (delete its file here first)

-- Leader must be set before any mapping that uses it.
vim.g.mapleader = ' '
vim.g.maplocalleader = ' '

require('config.options')
require('config.keymaps')
require('config.autocmds')
require('config.lsp')
require('config.session')

require('plugins.colorscheme')
require('plugins.treesitter')
require('plugins.mini-icons') -- before which-key, which picks it up
require('plugins.which-key')
require('plugins.nvim-tree')
require('plugins.telescope')
require('plugins.claudecode')
