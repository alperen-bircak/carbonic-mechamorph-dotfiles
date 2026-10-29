-- lua_ls overrides, merged on top of nvim-lspconfig's lsp/lua_ls.lua.
-- (after/lsp/ loads last, so these settings win.)
-- Teaches the server about Neovim's Lua API so `vim.*` isn't flagged
-- as an unknown global while editing this config.
return {
  settings = {
    Lua = {
      runtime = { version = 'LuaJIT' },
      workspace = {
        checkThirdParty = false,
        library = { vim.env.VIMRUNTIME },
      },
    },
  },
}
