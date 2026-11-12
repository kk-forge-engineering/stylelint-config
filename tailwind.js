// stylelint knows none of these at-rules, so it can check neither the name nor what follows it.
const tailwindAtRules = [
  "apply",
  "config",
  "custom-variant",
  "plugin",
  "reference",
  "slot",
  "source",
  "theme",
  "utility",
  "variant",
];

/**
 * Lets CSS use Tailwind 4: its at-rules, `--alpha()` and `--spacing()`, `@import "tailwindcss"`, `&` directly inside
 * `@utility` and `@custom-variant`, and theme variables such as `--text-xs--line-height`, `--spacing-0\.5` and
 * `--color-*: initial`, whose `--`, `\.` and `*` Tailwind gives a meaning.
 * @type {import("stylelint").Config}
 */
export default {
  rules: {
    "at-rule-no-unknown": [true, { ignoreAtRules: tailwindAtRules }],
    "at-rule-prelude-no-invalid": [true, { ignoreAtRules: tailwindAtRules }],
    // Tailwind inlines only a string `@import`. It leaves `@import url("tailwindcss")` to the browser and builds no
    // utilities, so a fix to the `url()` form that stylelint-config-standard asks for would break the build.
    "import-notation": "string",
    "custom-property-pattern": /^([a-z][a-z0-9]*((-{1,2}|\\\.)[a-z0-9]+)*(-\*)?|\*)$/,
    "nesting-selector-no-missing-scoping-root": [
      true,
      { ignoreAtRules: ["custom-variant", "utility"] },
    ],
    "declaration-property-value-no-unknown": [
      true,
      { ignoreProperties: { "/.+/": ["/--(alpha|spacing)\\(/"] } },
    ],
  },
};
