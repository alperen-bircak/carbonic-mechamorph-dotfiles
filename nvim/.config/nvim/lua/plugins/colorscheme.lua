-- Colorscheme: ayu dark, to match kitty's themes/ayu-v9.conf.
vim.pack.add({ 'https://github.com/Shatur/neovim-ayu' })

-- neovim-ayu's background is #0b0e14; kitty's ayu-v9 uses #0d1017 (ui.bg).
-- Swap it in every highlight group so Neovim blends into kitty's padding.
local ayu_bg, kitty_bg = 0x0b0e14, 0x0d1017

vim.api.nvim_create_autocmd('ColorScheme', {
  group = vim.api.nvim_create_augroup('plugins.colorscheme', {}),
  pattern = 'ayu*',
  callback = function()
    for name, hl in pairs(vim.api.nvim_get_hl(0, {})) do
      if hl.bg == ayu_bg then
        hl.bg = kitty_bg
        vim.api.nvim_set_hl(0, name, hl)
      end
    end
  end,
})

vim.cmd.colorscheme('ayu-dark')
