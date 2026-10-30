-- Colorscheme: standard ayu dark from neovim-ayu, with no colour changes.
vim.pack.add({ 'https://github.com/Shatur/neovim-ayu' })

vim.cmd.colorscheme('ayu-dark')

local group = vim.api.nvim_create_augroup('plugins.colorscheme', {})

-- The terminal's padding shows around the editor, so it matches Neovim's
-- background while Neovim runs. OSC 11 sets the terminal's background, OSC 111
-- resets it to the configured one.
vim.api.nvim_create_autocmd({ 'UIEnter', 'VimResume' }, {
  group = group,
  callback = function()
    local bg = vim.api.nvim_get_hl(0, { name = 'Normal' }).bg
    vim.api.nvim_ui_send(('\027]11;#%06x\027\\'):format(bg))
  end,
})
vim.api.nvim_create_autocmd({ 'VimLeavePre', 'VimSuspend' }, {
  group = group,
  callback = function()
    vim.api.nvim_ui_send('\027]111\027\\')
  end,
})
