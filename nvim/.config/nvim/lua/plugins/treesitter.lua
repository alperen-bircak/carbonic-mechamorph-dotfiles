-- Treesitter: syntax-aware highlighting, indentation and folds.
-- Neovim does the highlighting/folding itself; nvim-treesitter installs the
-- parsers (built with tree-sitter-cli from pacman) and provides queries.

-- Keep parsers in sync after the plugin updates (must exist before pack.add)
vim.api.nvim_create_autocmd('PackChanged', {
  group = vim.api.nvim_create_augroup('plugins.treesitter.update', {}),
  callback = function(ev)
    if ev.data.spec.name == 'nvim-treesitter' and ev.data.kind == 'update' then
      if not ev.data.active then
        vim.cmd.packadd('nvim-treesitter')
      end
      require('nvim-treesitter').update()
    end
  end,
})

vim.pack.add({ { src = 'https://github.com/nvim-treesitter/nvim-treesitter', version = 'main' } })

local ts = require('nvim-treesitter')

-- Parsers to have ready up front (no-op when already installed).
-- Anything else gets installed the first time you open such a file.
ts.install({
  'bash', 'c', 'cpp', 'javascript', 'json', 'lua', 'markdown', 'markdown_inline',
  'python', 'query', 'rust', 'toml', 'tsx', 'typescript', 'vim', 'vimdoc', 'yaml',
})

-- Turn on treesitter features for a buffer whose parser is installed
local function start(buf, lang)
  if not pcall(vim.treesitter.start, buf, lang) then
    return
  end

  -- Folds are window options: set them in every window showing this buffer
  for _, win in ipairs(vim.fn.win_findbuf(buf)) do
    vim.wo[win][0].foldmethod = 'expr'
    vim.wo[win][0].foldexpr = 'v:lua.vim.treesitter.foldexpr()'
  end

  -- Treesitter indent is experimental, so only use it where queries exist
  if vim.treesitter.query.get(lang, 'indents') then
    vim.bo[buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
  end
end

-- Autostart: on every new filetype, start treesitter if a parser exists,
-- install it in the background if nvim-treesitter knows one, else do nothing.
local available = nil -- list of installable parsers, looked up on first need
local installing = {} -- languages with an install in progress

vim.api.nvim_create_autocmd('FileType', {
  group = vim.api.nvim_create_augroup('plugins.treesitter.start', {}),
  callback = function(ev)
    local buf = ev.buf
    local lang = vim.treesitter.language.get_lang(ev.match)
    if not lang then
      return
    end

    if vim.treesitter.language.add(lang) then
      start(buf, lang)
      return
    end

    available = available or ts.get_available()
    if installing[lang] or not vim.list_contains(available, lang) then
      return
    end

    installing[lang] = true
    ts.install(lang):await(function(err)
      installing[lang] = nil
      vim.schedule(function()
        if not err and vim.api.nvim_buf_is_valid(buf) then
          start(buf, lang)
        end
      end)
    end)
  end,
})
