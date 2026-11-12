# stylelint-config

- `base.js` turns off only the layout rules, because oxfmt lays the CSS out. It also lets a custom property keep the case of its keywords. Every other rule of stylelint-config-standard stays on.
- `css-modules.js` and `tailwind.js` allow syntax their tool understands. `tailwind.js` also sets `import-notation` to strings, because Tailwind builds no utilities from an `@import url(...)`.
- A preset change adds a line to a fixture under `test/fixtures`. A clean fixture must report no finding, and a broken fixture must report exactly the rules `test/configs.test.ts` lists. oxfmt formats every fixture, and `mise run check` runs the test.
