-- nvim-tree: VS Code style file explorer in a sidebar, toggled with <leader>e.
-- Inside the tree, g? lists its keys (a add, r rename, d delete, x/c/p cut/copy/paste,
-- H toggle dotfiles, I toggle gitignored). Icons come from mini.icons' devicons mock.

-- It replaces netrw, which has to be switched off before it loads
vim.g.loaded_netrw = 1
vim.g.loaded_netrwPlugin = 1

vim.pack.add({ 'https://github.com/nvim-tree/nvim-tree.lua' })

require('nvim-tree').setup({
  view = { width = 32 },
  renderer = {
    group_empty = true, -- show a/b/c as one row when a and b hold nothing else (VS Code's compact folders)
    highlight_git = 'name', -- colour file names by git status, as well as the icon
    indent_markers = { enable = true },
  },
  update_focused_file = { enable = true }, -- reveal the current file in the tree
  diagnostics = { enable = true, show_on_dirs = true },
  filters = { git_ignored = false }, -- show gitignored files (dimmed); I toggles
})

vim.keymap.set('n', '<leader>e', '<cmd>NvimTreeToggle<cr>', { desc = 'Toggle file explorer' })

-- Close Neovim instead of leaving the tree alone once the last file window quits
vim.api.nvim_create_autocmd('QuitPre', {
  group = vim.api.nvim_create_augroup('plugins.nvim-tree', {}),
  callback = function()
    local tree = require('nvim-tree.api').tree
    local wins = vim.tbl_filter(function(win)
      return vim.api.nvim_win_get_config(win).relative == ''
    end, vim.api.nvim_tabpage_list_wins(0))
    if #wins == 2 and tree.is_visible() then
      tree.close()
    end
  end,
})
