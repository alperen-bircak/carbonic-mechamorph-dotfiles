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

-- nvim-tree only picks up outside git changes (commits, staging) when the repo
-- root is in the tree, so opened on a subfolder its git colours go stale.
-- Check the repo's index and HEAD every second and reload the tree on a change.
local git_stamp
vim.uv.new_timer():start(1000, 1000, vim.schedule_wrap(function()
  local api = require('nvim-tree.api')
  local root = api.tree.is_visible() and vim.fs.root(vim.fn.getcwd(), '.git')
  if not root then
    git_stamp = nil -- reload as soon as it's shown again
    return
  end
  local stamp = ''
  for _, file in ipairs({ 'index', 'HEAD' }) do
    local stat = vim.uv.fs_stat(root .. '/.git/' .. file)
    stamp = stamp .. (stat and stat.mtime.sec .. '.' .. stat.mtime.nsec or '-') .. ' '
  end
  if git_stamp and stamp ~= git_stamp then
    api.tree.reload()
  end
  git_stamp = stamp
end))

-- Close Neovim instead of leaving the tree alone once the last file window quits.
-- Checked after the quit is done: closing the tree during QuitPre cancels a :qa.
vim.api.nvim_create_autocmd('QuitPre', {
  group = vim.api.nvim_create_augroup('plugins.nvim-tree', {}),
  callback = function()
    vim.schedule(function()
      local wins = vim.tbl_filter(function(win)
        return vim.api.nvim_win_get_config(win).relative == ''
      end, vim.api.nvim_tabpage_list_wins(0))
      if #wins == 1 and vim.bo[vim.api.nvim_win_get_buf(wins[1])].filetype == 'NvimTree' then
        vim.cmd.quit()
      end
    end)
  end,
})

-- Plain `nvim` opens the tree on the folder it was run in. `nvim file`, `nvim -`
-- and headless runs are left alone; `nvim folder` is handled by nvim-tree itself.
local started_with_stdin = false
vim.api.nvim_create_autocmd('StdinReadPre', {
  group = 'plugins.nvim-tree',
  callback = function()
    started_with_stdin = true
  end,
})
vim.api.nvim_create_autocmd('VimEnter', {
  group = 'plugins.nvim-tree',
  callback = function()
    if vim.fn.argc(-1) == 0 and not started_with_stdin and #vim.api.nvim_list_uis() > 0 then
      require('nvim-tree.api').tree.open({ path = vim.fn.getcwd() })
    end
  end,
})
