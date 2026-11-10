-- render-markdown: draws markdown nicely inside the buffer (heading icons and
-- bands, box-drawn tables, code blocks, checkboxes, callouts). The line under
-- the cursor shows the raw text for editing; :RenderMarkdown toggle turns it
-- off/on. Uses the treesitter markdown parsers and mini.icons for icons.
vim.pack.add({ 'https://github.com/MeanderingProgrammer/render-markdown.nvim' })

require('render-markdown').setup()
