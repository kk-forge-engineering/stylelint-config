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
        // This rule skips `composes`, because its values are class names.
        // Class names are case-sensitive, so a lowered name matches no class.
        "value-keyword-case": ["lower", { ignoreProperties: ["composes"] }],
      },
    },
  ],
};
