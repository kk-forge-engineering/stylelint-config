/**
 * Values come from design tokens. A size, radius, weight, line height or color is written as a `var()` of a token, not
 * as a number, so one change of the token reaches every screen. The tokens themselves live in a file named
 * `tokens.css`, which the rules skip. Theme and layout follow the same idea: a theme is `light-dark()` inside the
 * token, not a second palette under `@media (prefers-color-scheme)`, and a screen lays out by its container
 * (`@container`), not by the window. A real exception carries a disable comment with its reason.
 */
/** @type {import("stylelint").Config["rules"]} */
const rules = {
  "declaration-property-unit-disallowed-list": {
    "font-size": ["px", "em", "rem", "%"],
    "/radius$/": ["px", "em", "rem"],
  },
  // `font` hides size, weight and line height from the rules above, so it may only reset them with `inherit`.
  "declaration-property-value-allowed-list": {
    "font-weight": ["/^var\\(--[a-z0-9-]+\\)$/", "inherit"],
    "line-height": ["/^var\\(--[a-z0-9-]+\\)$/", "1", "normal", "inherit"],
    font: ["inherit"],
  },
  "color-no-hex": true,
  "function-disallowed-list": ["rgb", "rgba", "hsl", "hsla"],
  "media-feature-name-disallowed-list": ["prefers-color-scheme", "width", "min-width", "max-width"],
};

/** @type {import("stylelint").Config} */
export default {
  rules,
  overrides: [
    {
      files: ["**/tokens.css"],
      rules: Object.fromEntries(Object.keys(rules).map((rule) => [rule, null])),
    },
  ],
};
