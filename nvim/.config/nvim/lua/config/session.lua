-- Carry on where you left off: plain `nvim`, from any folder, brings back the
-- last session (files, splits, tabs, working directory, file tree). `nvim file`
-- neither restores nor saves it, so a quick edit can't replace your workspace.
local file = vim.fn.stdpath('state') .. '/session.vim'
local group = vim.api.nvim_create_augroup('config.session', {})

-- Terminals and the tree's own window can't be restored, so sessions skip them.
-- globals keeps g:SessionTree, which reopens the tree instead.
vim.opt.sessionoptions:remove({ 'blank', 'terminal' })
vim.opt.sessionoptions:append('globals')

local function has_file_window()
  for _, win in ipairs(vim.api.nvim_list_wins()) do
    local buf = vim.api.nvim_win_get_buf(win)
    if vim.bo[buf].buftype == '' and vim.api.nvim_buf_get_name(buf) ~= '' then
      return true
    end
  end
  return false
end

local function save()
  -- Nothing worth keeping, e.g. only the tree is left: keep the last save
  if has_file_window() then
    vim.g.SessionTree = require('nvim-tree.api').tree.is_visible() and 1 or 0
    vim.cmd.mksession({ vim.fn.fnameescape(file), bang = true })
  end
end

local started_with_stdin = false
vim.api.nvim_create_autocmd('StdinReadPre', {
  group = group,
  callback = function()
    started_with_stdin = true
  end,
})

vim.api.nvim_create_autocmd('VimEnter', {
  group = group,
  nested = true, -- let the restored buffers fire FileType etc.
  callback = function()
    if vim.fn.argc(-1) > 0 or started_with_stdin or #vim.api.nvim_list_uis() == 0 then
      return
    end
    if vim.uv.fs_stat(file) then
      vim.cmd('silent! source ' .. vim.fn.fnameescape(file))
      if vim.g.SessionTree == 1 then
        require('nvim-tree.api').tree.toggle({ focus = false })
      end
    end
    -- QuitPre too: when the last file closes, nvim-tree's quit would otherwise
    -- leave VimLeavePre with only the tree to save
    vim.api.nvim_create_autocmd({ 'QuitPre', 'VimLeavePre' }, { group = group, callback = save })
  end,
})
