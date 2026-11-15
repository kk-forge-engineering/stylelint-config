# @kk-forge/stylelint-config

Shared stylelint configs for KK Forge's CSS. oxfmt formats the CSS, so the configs hold no layout rules.

- `base`: stylelint-config-standard without its blank-line and comment-spacing rules. Keywords in a custom property keep their case, so `--sans: BlinkMacSystemFont, sans-serif` passes. A disable comment must name a rule the config has, give its reason after `--`, and silence a finding.
- `css-modules`: lets a file named `*.module.css` use `:global` and `composes`.
- `tailwind`: Tailwind 4's at-rules, the `--alpha()` and `--spacing()` functions, `@import "tailwindcss"`, `&` directly inside `@utility` and `@custom-variant`, and theme variables such as `--text-xs--line-height` and `--color-*: initial`.
- `tokens`: font sizes, radii, weights, line heights and colors come from design tokens as `var()`. A font size or radius takes no unit, so a keyword such as `inherit` passes, and a radius may still take `%`, such as `50%` for a circle. A weight or line height may also be `inherit`, and a line height `1` or `normal`. A fallback follows the same rules: `var(--fw, var(--fw-strong))` passes, `var(--fw, 600)` and `var(--text, #fff)` are reported. `font` only resets with `inherit`. Colors are never hex, named or a color function (`rgb()`, `oklch()` and the rest). A property that names something (`container-name`, `animation`, `grid-area`, `font-family` and the like) takes an identifier, so `tan` there is a name and passes. There is no second palette under `@media (prefers-color-scheme)` and no layout by the window width (`@container` instead), in `@media` and in `@custom-media` alike. The file named `tokens.css` sets the values, so the value rules skip it; the `@media` ban still holds there. `@font-face` goes there too, because its `font-weight` is the range of the font file and takes no `var()`. A consumer whose values file has another name gives that file the same override in its own config. A real exception carries a disable comment with its reason.

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
