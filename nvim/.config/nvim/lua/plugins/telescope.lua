-- telescope: fuzzy finder for files, text, buffers, help and keymaps (<leader>f...).
-- <leader>fk is the cheatsheet: it searches every live mapping by key or `desc`.
-- Inside a picker: <C-j>/<C-k> move, <CR> opens, <C-x>/<C-v> open in a split, <C-/> lists its keys.
-- Live grep needs ripgrep (rg). File icons come from mini.icons' devicons mock.
vim.pack.add({
  'https://github.com/nvim-lua/plenary.nvim', -- required by telescope
  'https://github.com/nvim-telescope/telescope.nvim',
})

local telescope = require('telescope')
local actions = require('telescope.actions')

telescope.setup({
  defaults = {
    mappings = {
      i = {
        ['<C-j>'] = actions.move_selection_next,
        ['<C-k>'] = actions.move_selection_previous,
      },
    },
  },
})

local builtin = require('telescope.builtin')
local map = vim.keymap.set

map('n', '<leader>ff', builtin.find_files, { desc = 'Find files' })
map('n', '<leader>fg', builtin.live_grep, { desc = 'Grep in project' })
map('n', '<leader>fb', builtin.buffers, { desc = 'Open buffers' })
map('n', '<leader>fr', builtin.oldfiles, { desc = 'Recent files' })
map('n', '<leader>f/', builtin.current_buffer_fuzzy_find, { desc = 'Search in this file' })
map('n', '<leader>fh', builtin.help_tags, { desc = 'Help pages' })
map('n', '<leader>fk', builtin.keymaps, { desc = 'Keymaps' })
map('n', '<leader>fc', builtin.commands, { desc = 'Commands' })
map('n', '<leader>fd', builtin.diagnostics, { desc = 'Diagnostics' })
map('n', '<leader>f.', builtin.resume, { desc = 'Reopen last search' })
