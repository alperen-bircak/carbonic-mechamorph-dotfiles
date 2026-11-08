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
