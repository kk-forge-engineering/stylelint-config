import customMedia from "./custom-media.js";

/** A token, `var(--name)`, or a token with a token as its fallback, `var(--name, var(--other))`. */
const tokenOrFallback = "/^var\\(--[a-z0-9-]+(, *var\\(--[a-z0-9-]+\\))?\\)$/";

/** Media features a theme or a layout must not ask: the color scheme and the window width. */
const windowFeatures = ["prefers-color-scheme", "width", "min-width", "max-width"];

/** @type {import("stylelint").Config["rules"]} */
const valueRules = {
  // A font size or radius takes no unit at all, so no unit is left to slip past a list. A radius keeps `%`: `50%` is a
  // shape (a circle), not a size. A pill's fully round edge is a token too, such as `--radius-full: 999px`.
  "declaration-property-unit-allowed-list": {
    "font-size": [],
    "/radius$/": ["%"],
  },
  "declaration-property-value-allowed-list": {
    // A fallback is held to the same rule: a token, never a number, so `var(--fw, 600)` is reported and
    // `var(--fw, var(--fw-strong))` passes. One level of fallback; a deeper chain is spelled as its own token.
    "font-weight": [tokenOrFallback, "inherit"],
    // `1` is a glyph or badge with no leading, not a step of the scale.
    "line-height": [tokenOrFallback, "1", "normal", "inherit"],
    // `font` sets size, weight and line height past the checks on each of them, so it may only reset them.
    font: ["inherit"],
  },
  "color-no-hex": true,
  // A property that names something (a container, a counter, a timeline, a view transition) takes an identifier, and
  // `tan` or `navy` there is a name, not a color. Animations, fonts, grid areas and list styles stylelint skips itself.
  "color-named": [
    "never",
    {
      ignoreProperties: [
        "anchor-name",
        "container",
        "container-name",
        "content",
        "counter-reset",
        "counter-set",
        "grid",
        "grid-column-end",
        "grid-column-start",
        "grid-row-end",
        "grid-row-start",
        "grid-template",
        "grid-template-areas",
        "page",
        "position-anchor",
        "scroll-timeline",
        "scroll-timeline-name",
        "timeline-scope",
        "view-timeline",
        "view-timeline-name",
        "view-transition-class",
        "view-transition-name",
      ],
    },
  ],
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
  plugins: [customMedia],
  rules: {
    ...valueRules,
    // The tokens file is held to these too: a second palette would be written exactly there. `@custom-media` is
    // checked as well, or a banned query could be named once there and used as `@media (--name)`.
    "media-feature-name-disallowed-list": windowFeatures,
    "kk-forge/custom-media-feature-name-disallowed-list": windowFeatures,
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
