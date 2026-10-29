-- Editor options. See `:h option-list` for what each one does.
local o = vim.opt

-- Interface
o.number = true -- line numbers...
o.relativenumber = true -- ...relative to the cursor, for easy `5j` / `3k` jumps
o.signcolumn = 'yes' -- always show the gutter so text doesn't shift around
o.cursorline = true -- highlight the current line
o.scrolloff = 8 -- keep 8 lines visible above/below the cursor
o.splitright = true -- :vsplit opens to the right
o.splitbelow = true -- :split opens below
o.wrap = false
o.mouse = 'a'

-- Editing
o.expandtab = true -- insert spaces instead of tabs
o.shiftwidth = 4 -- width of one indent level
o.tabstop = 4 -- width of a tab character
o.clipboard = 'unnamedplus' -- yank/paste use the system clipboard (via wl-clipboard)
o.undofile = true -- keep undo history after closing a file

-- Search
o.ignorecase = true -- case-insensitive search...
o.smartcase = true -- ...unless the pattern contains a capital

-- Completion menu: show even for one match, don't auto-insert, show docs popup
o.completeopt = { 'menuone', 'noselect', 'popup' }

-- Folds start open; treesitter (plugins/treesitter.lua) decides where they are
o.foldlevel = 99
