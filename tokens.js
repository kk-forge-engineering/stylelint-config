/** @type {import("stylelint").Config["rules"]} */
const valueRules = {
  // A font size or radius takes no unit at all, so no unit is left to slip past a list. A radius keeps `%`: `50%` is a
  // shape (a circle), not a size. A pill's fully round edge is a token too, such as `--radius-full: 999px`.
  "declaration-property-unit-allowed-list": {
    "font-size": [],
    "/radius$/": ["%"],
  },
  "declaration-property-value-allowed-list": {
    "font-weight": ["/^var\\(--[a-z0-9-]+\\)$/", "inherit"],
    // `1` is a glyph or badge with no leading, not a step of the scale.
    "line-height": ["/^var\\(--[a-z0-9-]+\\)$/", "1", "normal", "inherit"],
    // `font` sets size, weight and line height past the checks on each of them, so it may only reset them.
    font: ["inherit"],
  },
  "color-no-hex": true,
  "color-named": "never",
  "function-disallowed-list": [
    "rgb",
    "rgba",
    "hsl",
    "hsla",
    "hwb",
    "lab",
    "lch",
    "oklab",
    "oklch",
    "color",
  ],
};

/**
 * Asks for a design token as `var()` where a size, radius, weight, line height or color would be a value, so one
 * change of the token reaches every screen. A theme is `light-dark()` inside the token, not a second palette under
 * `@media (prefers-color-scheme)`, and a screen lays out by `@container`, not by the window width.
 * @type {import("stylelint").Config}
 */
export default {
  rules: {
    ...valueRules,
    // The tokens file is held to this one too: a second palette would be written exactly there.
    "media-feature-name-disallowed-list": [
      "prefers-color-scheme",
      "width",
      "min-width",
      "max-width",
    ],
  },
  overrides: [
    {
      // The file named `tokens.css` sets the tokens, so it is the one file where their values are written out.
      // `@font-face` goes there too: its `font-weight` is the weight range of the font file and takes no `var()`.
      // A consumer whose values file has another name gives that file the same override in its own config.
      files: ["**/tokens.css"],
      rules: Object.fromEntries(Object.keys(valueRules).map((rule) => [rule, null])),
    },
  ],
};
