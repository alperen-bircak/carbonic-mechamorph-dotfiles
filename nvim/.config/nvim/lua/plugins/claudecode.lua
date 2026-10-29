-- claudecode.nvim: lets Claude Code connect to Neovim like it does to VS Code.
-- On startup it writes a lock file to ~/.claude/ide/, so `/ide` in a claude
-- running elsewhere (another kitty window) finds this Neovim; claude started
-- inside Neovim (<leader>ac) connects on its own. Once connected, Claude sees
-- the current file and selection, and shows its edits here as diffs:
-- :w / <leader>aa accepts one, :q / <leader>ad rejects it.
vim.pack.add({ 'https://github.com/coder/claudecode.nvim' })

require('claudecode').setup({
  terminal = { provider = 'native' }, -- Neovim's own terminal; no snacks.nvim
})

local map = vim.keymap.set

map('n', '<leader>ac', '<cmd>ClaudeCode<cr>', { desc = 'Toggle Claude' })
map('n', '<leader>af', '<cmd>ClaudeCodeFocus<cr>', { desc = 'Focus Claude' })
map('n', '<leader>ar', '<cmd>ClaudeCode --resume<cr>', { desc = 'Resume Claude session' })
map('n', '<leader>ab', '<cmd>ClaudeCodeAdd %<cr>', { desc = 'Add file to Claude' })
map('v', '<leader>as', '<cmd>ClaudeCodeSend<cr>', { desc = 'Send selection to Claude' })
map('n', '<leader>aa', '<cmd>ClaudeCodeDiffAccept<cr>', { desc = 'Accept Claude diff' })
map('n', '<leader>ad', '<cmd>ClaudeCodeDiffDeny<cr>', { desc = 'Reject Claude diff' })

-- In the file explorer, <leader>as adds the file under the cursor
vim.api.nvim_create_autocmd('FileType', {
  group = vim.api.nvim_create_augroup('plugins.claudecode', {}),
  pattern = 'NvimTree',
  callback = function(ev)
    map('n', '<leader>as', '<cmd>ClaudeCodeTreeAdd<cr>', { buffer = ev.buf, desc = 'Add file to Claude' })
  end,
})
