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

-- Reload files changed outside Neovim (e.g. edited by Claude) without waiting
-- for focus: check every second. 'autoread' (on by default) reloads unmodified
-- buffers silently; ones with unsaved edits still ask first.
vim.uv.new_timer():start(1000, 1000, vim.schedule_wrap(function()
  -- :checktime isn't allowed while typing a command or in the command-line window
  if vim.fn.mode() ~= 'c' and vim.fn.getcmdwintype() == '' then
    vim.cmd.checktime()
  end
end))
