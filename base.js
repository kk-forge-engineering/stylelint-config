/**
 * Extends `stylelint-config-standard` and turns off its blank-line and
 * comment-spacing rules. The formatter oxfmt sets that layout, so these rules
 * would only fight its output.
 * @type {import("stylelint").Config}
 */
export default {
  extends: ["stylelint-config-standard"],
  reportDescriptionlessDisables: true,
  reportInvalidScopeDisables: true,
  reportNeedlessDisables: true,
  reportUnscopedDisables: true,
  rules: {
    "at-rule-empty-line-before": null,
    "comment-empty-line-before": null,
    "comment-whitespace-inside": null,
    "custom-property-empty-line-before": null,
    "declaration-empty-line-before": null,
    "rule-empty-line-before": null,
    // The check skips custom properties, so a font list in one keeps its case.
    // Chrome matches the font `BlinkMacSystemFont` only in this exact case.
    "value-keyword-case": ["lower", { ignoreProperties: ["/^--/"] }],
  },
};
