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
-- for focus: check every second.
vim.uv.new_timer():start(1000, 1000, vim.schedule_wrap(function()
  -- :checktime isn't allowed while typing a command or in the command-line window
  if vim.fn.mode() ~= 'c' and vim.fn.getcmdwintype() == '' then
    vim.cmd.checktime()
  end
end))

-- What to do when a file changed on disk. Without unsaved edits: reload it.
-- With them: keep yours and warn, instead of Neovim's prompt, which could pop
-- up mid-typing and take the next key as its answer. A plain :w then asks
-- before overwriting the disk version.
vim.api.nvim_create_autocmd('FileChangedShell', {
  group = group,
  callback = function(ev)
    local reason = vim.v.fcs_reason
    local name = vim.fn.fnamemodify(ev.file, ':~:.')
    if reason == 'conflict' then
      vim.v.fcs_choice = ''
      vim.notify(
        name .. ' changed on disk, and you have unsaved edits; kept yours.\n'
          .. ':DiffOrig compares, :e! loads the disk version, :w! keeps yours',
        vim.log.levels.WARN
      )
    elseif reason == 'deleted' then
      vim.v.fcs_choice = ''
      vim.notify(name .. ' was deleted on disk; :w writes it back', vim.log.levels.WARN)
    else
      vim.v.fcs_choice = 'reload'
    end
  end,
})

-- Compare the buffer with the file on disk side by side (Vim's DiffOrig).
-- In the diff, do / dp pull or push a change; close the scratch side with :q.
vim.api.nvim_create_user_command(
  'DiffOrig',
  'vert new | set buftype=nofile | read ++edit # | 0d_ | diffthis | wincmd p | diffthis',
  { desc = 'Diff the buffer against the file on disk' }
)
