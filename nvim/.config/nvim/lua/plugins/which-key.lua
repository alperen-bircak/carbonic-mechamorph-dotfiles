-- which-key: pause after a prefix key (e.g. <Space>) to see what can follow.
-- Labels come from each mapping's `desc`; groups are named below.
vim.pack.add({ 'https://github.com/folke/which-key.nvim' })

local wk = require('which-key')

wk.setup({
  preset = 'modern',
  spec = {
    { '<leader>a', group = 'Claude' },
    { '<leader>d', group = 'Diagnostics' },
    { '<leader>l', group = 'LSP' },
  },
})

vim.keymap.set('n', '<leader>?', function()
  wk.show({ global = false })
end, { desc = 'Buffer keymaps' })
