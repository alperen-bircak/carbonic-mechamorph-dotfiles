-- Small quality-of-life autocommands.
local group = vim.api.nvim_create_augroup('config.autocmds', {})

-- Briefly highlight yanked text
vim.api.nvim_create_autocmd('TextYankPost', {
  group = group,
  callback = function()
    vim.hl.on_yank()
  end,
})

-- Reopen files at the last cursor position
vim.api.nvim_create_autocmd('BufReadPost', {
  group = group,
  callback = function(ev)
    local mark = vim.api.nvim_buf_get_mark(ev.buf, '"')
    local last_line = vim.api.nvim_buf_line_count(ev.buf)
    -- Skip commit messages etc., where the old position is meaningless
    if mark[1] > 0 and mark[1] <= last_line and vim.bo[ev.buf].filetype ~= 'gitcommit' then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- Reload files changed on disk (e.g. by Claude) when the buffer has no unsaved
-- changes. 'autoread' does the reloading, but only when Neovim checks the file,
-- so check on focus/buffer switches and once a second. A buffer with unsaved
-- changes still gets Neovim's usual "changed since editing started" prompt.
vim.o.autoread = true
vim.api.nvim_create_autocmd({ 'FocusGained', 'BufEnter', 'CursorHold', 'CursorHoldI' }, {
  group = group,
  callback = function()
    if vim.fn.getcmdwintype() == '' then
      vim.cmd.checktime()
    end
  end,
})
vim.uv.new_timer():start(1000, 1000, vim.schedule_wrap(function()
  -- Only from normal/insert/visual mode: not while typing a command, at a
  -- prompt, or in a terminal buffer
  local mode = vim.api.nvim_get_mode()
  if mode.blocking or not mode.mode:match('^[nivV\22]') or vim.fn.getcmdwintype() ~= '' then
    return
  end
  vim.cmd.checktime()
end))
vim.api.nvim_create_autocmd('FileChangedShellPost', {
  group = group,
  callback = function(ev)
    -- Also fires after the W12 warning, when nothing was reloaded
    if vim.bo[ev.buf].modified then
      return
    end
    vim.notify('Reloaded ' .. vim.fn.fnamemodify(ev.file, ':~:.') .. ' from disk', vim.log.levels.INFO)
  end,
})

-- Tell kitty when Neovim is in the foreground, so kitty.conf can pass it <C-v>
-- instead of pasting.
vim.api.nvim_create_autocmd({ 'VimEnter', 'VimResume', 'UIEnter' }, {
  group = group,
  callback = function()
    vim.api.nvim_ui_send('\027]1337;SetUserVar=in_editor=MQ==\007')
  end,
})
vim.api.nvim_create_autocmd({ 'VimLeave', 'VimSuspend' }, {
  group = group,
  callback = function()
    vim.api.nvim_ui_send('\027]1337;SetUserVar=in_editor\007')
  end,
})
