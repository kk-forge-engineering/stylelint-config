import stylelint from "stylelint";

const { createPlugin, utils } = stylelint;

const ruleName = "kk-forge/custom-media-feature-name-disallowed-list";
const messages = utils.ruleMessages(ruleName, {
  rejected: (/** @type {string} */ params) =>
    `Unexpected media feature name in @custom-media ${params}`,
});

/**
 * `media-feature-name-disallowed-list` reads `@media` only, so a feature banned there could still be named once in
 * `@custom-media` and used as `@media (--name)`. This rule holds the query of each `@custom-media` to the same list:
 * it lints the query as an `@media` with the built-in rule itself, so both read one grammar.
 * @type {import("stylelint").Rule<string[]>}
 */
const rule = (names) => async (root, result) => {
  if (
    !utils.validateOptions(result, ruleName, {
      actual: names,
      possible: [(name) => typeof name === "string" || name instanceof RegExp],
    })
  ) {
    return;
  }
  /** @type {Promise<void>[]} */
  const checks = [];
  // At-rule names are case-insensitive, as the built-in reads `@media`.
  root.walkAtRules(/^custom-media$/i, (atRule) => {
    // The grammar is `@custom-media <extension-name> <media-query-list>`: the name is the first word. The raw params
    // are dropped from the clone, or the built-in would read them, name and comments included, instead of the query.
    const query = atRule.params.replace(/^\S+\s*/, "");
    const media = root.clone();
    media.removeAll();
    media.append(
      atRule.clone({ name: "media", params: query, raws: { ...atRule.raws, params: undefined } }),
    );
    checks.push(
      (async () => {
        // One report per at-rule, however many of its features are banned: the message names the at-rule.
        let rejected = false;
        await utils.checkAgainstRule(
          { ruleName: "media-feature-name-disallowed-list", ruleSettings: [names], root: media },
          () => {
            rejected = true;
          },
        );
        if (rejected) {
          utils.report({
            ruleName,
            result,
            node: atRule,
            message: messages.rejected(atRule.params),
          });
        }
      })(),
    );
  });
  await Promise.all(checks);
};
rule.ruleName = ruleName;
rule.messages = messages;
// The setting is the list itself, as for the built-in rule, not [primary, secondary options].
rule.primaryOptionArray = true;

export default createPlugin(ruleName, rule);
