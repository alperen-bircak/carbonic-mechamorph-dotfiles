-- General keymaps. LSP keymaps live in config/lsp.lua.
-- Every mapping gets a `desc`: which-key shows it as the label.
local map = vim.keymap.set

-- Files
map('n', '<leader>w', '<cmd>write<cr>', { desc = 'Save file' })
map('n', '<leader>q', '<cmd>quit<cr>', { desc = 'Quit window' })

-- Diagnostics (<C-w>d and ]d / [d are built in)
map('n', '<leader>dd', vim.diagnostic.open_float, { desc = 'Show diagnostic' })
map('n', '<leader>dl', vim.diagnostic.setloclist, { desc = 'List buffer diagnostics' })
map('n', '<leader>dq', vim.diagnostic.setqflist, { desc = 'List all diagnostics' })

-- Window navigation: <C-h> instead of <C-w>h, etc.
map('n', '<C-h>', '<C-w>h', { desc = 'Window left' })
map('n', '<C-j>', '<C-w>j', { desc = 'Window down' })
map('n', '<C-k>', '<C-w>k', { desc = 'Window up' })
map('n', '<C-l>', '<C-w>l', { desc = 'Window right' })

-- Clear search highlighting
map('n', '<Esc>', '<cmd>nohlsearch<cr>', { desc = 'Clear search highlight' })
