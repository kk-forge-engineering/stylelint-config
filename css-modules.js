/**
 * Lets a file named `*.module.css` use `:global` and `composes`. Plain CSS beside it still reports both, since only a
 * CSS Modules build understands them.
 * @type {import("stylelint").Config}
 */
export default {
  overrides: [
    {
      files: ["**/*.module.css"],
      rules: {
        "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
        "property-no-unknown": [true, { ignoreProperties: ["composes"] }],
        // The rule skips `composes`, whose values are case-sensitive class names.
        // The rule also skips custom properties, as `base.js` does.
        // stylelint replaces the options of `base.js` with these, so this list repeats them.
        "value-keyword-case": ["lower", { ignoreProperties: ["composes", "/^--/"] }],
      },
    },
  ],
};
