-- Language servers. The servers themselves come from pacman; nvim-lspconfig
-- only supplies their default configs (in its lsp/ folder).
--
-- Built-in keymaps (no setup needed):
--   K hover docs   grn rename   gra code action   grr references
--   gri implementation   gO document symbols   <C-s> signature help (insert)
vim.pack.add({ 'https://github.com/neovim/nvim-lspconfig' })

-- Server names are nvim-lspconfig's; see `:h lspconfig-all`.
vim.lsp.enable({
  'lua_ls', -- lua-language-server
  'bashls', -- bash-language-server (uses shellcheck for lint warnings)
  'pyright', -- pyright
  'clangd', -- clang
  'rust_analyzer', -- rust-analyzer
  'ts_ls', -- typescript-language-server
  'jsonls', -- vscode-json-languageserver
  'yamlls', -- yaml-language-server
  'marksman', -- marksman (Markdown)
  'taplo', -- taplo-cli (TOML)
  'roslyn_ls', -- roslyn-language-server (dotnet tool)
})

-- Diagnostics: message at the end of the line, plus a float when jumping
-- with ]d / [d. (<leader>dd or <C-w>d opens the float on demand.)
vim.diagnostic.config({
  virtual_text = true,
  severity_sort = true, -- errors win over warnings on the same line
  float = { border = 'rounded', source = true },
  jump = {
    on_jump = function(diagnostic, bufnr)
      if diagnostic then
        vim.diagnostic.open_float({ bufnr = bufnr, scope = 'cursor', focus = false })
      end
    end,
  },
})

-- Per-buffer setup once a server attaches
vim.api.nvim_create_autocmd('LspAttach', {
  group = vim.api.nvim_create_augroup('config.lsp', {}),
  callback = function(ev)
    local client = assert(vim.lsp.get_client_by_id(ev.data.client_id))

    -- Built-in completion menu while typing (<C-y> accepts, <C-n>/<C-p> move)
    if client:supports_method('textDocument/completion') then
      vim.lsp.completion.enable(true, client.id, ev.buf, { autotrigger = true })
    end

    local function map(lhs, rhs, desc)
      vim.keymap.set('n', lhs, rhs, { buffer = ev.buf, desc = desc })
    end
    map('gd', vim.lsp.buf.definition, 'Go to definition')
    map('gD', vim.lsp.buf.declaration, 'Go to declaration')
    map('<leader>lf', vim.lsp.buf.format, 'Format buffer')
    map('<leader>lr', '<cmd>lsp restart<cr>', 'Restart server')
    map('<leader>li', '<cmd>checkhealth vim.lsp<cr>', 'Server info')
  end,
})
