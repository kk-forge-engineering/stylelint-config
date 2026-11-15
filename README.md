# @kk-forge/stylelint-config

Shared stylelint configs for KK Forge's CSS. oxfmt formats the CSS, so the configs hold no layout rules.

- `base`: stylelint-config-standard without its blank-line and comment-spacing rules. Keywords in a custom property keep their case, so `--sans: BlinkMacSystemFont, sans-serif` passes. A disable comment must name a rule the config has, give its reason after `--`, and silence a finding.
- `css-modules`: lets a file named `*.module.css` use `:global` and `composes`.
- `tailwind`: Tailwind 4's at-rules, the `--alpha()` and `--spacing()` functions, `@import "tailwindcss"`, `&` directly inside `@utility` and `@custom-variant`, and theme variables such as `--text-xs--line-height` and `--color-*: initial`.
- `tokens`: sizes, radii, weights, line heights and colors come from design tokens as `var()`, not numbers; `font` only resets with `inherit`; no second palette under `@media (prefers-color-scheme)` and no layout by the window width (`@container` instead). A file named `tokens.css` sets the values and is skipped. A real exception carries a disable comment with its reason.

## Use

```bash
npm install -D @kk-forge/stylelint-config stylelint
```

`stylelint.config.mjs`:

```js
export default {
  extends: ["@kk-forge/stylelint-config/base", "@kk-forge/stylelint-config/css-modules"],
};
```

A package lists `base` first and adds `css-modules` or `tailwind` when its CSS uses them, and `tokens` when its values come from a tokens file. Its own rules go below `extends` and win, and each one carries a comment with its reason.

## Development

`mise run setup` installs the packages. `mise run check` type-checks, lints and formats, then lints the fixtures through the packed configs.

## Release

Raise `version` in package.json and merge to main. CI publishes to npm once the `production` environment approves.
