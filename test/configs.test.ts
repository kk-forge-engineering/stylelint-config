import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, suite, test } from "node:test";
import { fileURLToPath } from "node:url";
import stylelint, { type LinterOptions } from "stylelint";

// The test packs the package and unpacks it into a consumer's node_modules.
// The presets then resolve through the package's `exports` and `files`, as
// they do for a consumer. The consumer links stylelint-config-standard from
// this repo, where npm would install it beside the package as a dependency.
const root = fileURLToPath(new URL("..", import.meta.url));
const consumer = mkdtempSync(join(tmpdir(), "stylelint-config-"));
const pack = spawnSync("npm", ["pack", "--silent", "--pack-destination", consumer], {
  cwd: root,
  encoding: "utf8",
});
assert.equal(pack.status, 0, pack.stderr);
const installed = join(consumer, "node_modules", "@kk-forge", "stylelint-config");
mkdirSync(installed, { recursive: true });
const tarball = join(consumer, pack.stdout.trim().split("\n").at(-1) ?? "");
assert.equal(
  spawnSync("tar", ["-xzf", tarball, "-C", installed, "--strip-components=1"]).status,
  0,
);
symlinkSync(
  join(root, "node_modules", "stylelint-config-standard"),
  join(consumer, "node_modules", "stylelint-config-standard"),
);
// stylelint is a peer dependency, which a consumer installs itself. The tokens plugin imports it.
symlinkSync(join(root, "node_modules", "stylelint"), join(consumer, "node_modules", "stylelint"));
// stylelint resolves `extends` from the working directory. In this repo the
// package's own name resolves to its source. The test works from the consumer
// so that stylelint reads only the unpacked tarball.
process.chdir(consumer);

/**
 * Returns the sorted rules that the presets report on the source, each once.
 * A parse error or an invalid option counts by its message text.
 */
async function reported(
  presets: string[],
  source: Pick<LinterOptions, "files" | "code" | "codeFilename">,
): Promise<string[]> {
  const { results } = await stylelint.lint({
    config: { extends: presets.map((preset) => `@kk-forge/stylelint-config/${preset}`) },
    ...source,
  });
  const rules = results.flatMap((result) => [
    ...result.warnings.map((warning) => warning.rule),
    ...result.parseErrors.map((error) => error.text),
    ...result.invalidOptionWarnings.map((warning) => warning.text),
  ]);
  return [...new Set(rules)].toSorted((left, right) => left.localeCompare(right));
}

/** Returns the rules that the presets report on a fixture under `test/fixtures`. */
const reportedRules = (presets: string[], fixture: string): Promise<string[]> =>
  reported(presets, { files: fileURLToPath(new URL(`fixtures/${fixture}`, import.meta.url)) });

/** Returns the rules that base and tokens report on CSS linted as a component file, not the tokens file. */
const reportedOn = (code: string): Promise<string[]> =>
  reported(["base", "tokens"], { code, codeFilename: join(consumer, "src", "panel.css") });

await suite("presets", async () => {
  after(() => rmSync(consumer, { recursive: true, force: true }));

  // oxfmt lays out each clean fixture. A clean result therefore also shows
  // that the presets raise no layout rule against the oxfmt output.
  await test("a fixture written to the presets reports nothing", async () => {
    assert.deepEqual(await reportedRules(["base"], "base/clean.css"), []);
    assert.deepEqual(
      await reportedRules(["base", "css-modules"], "css-modules/clean.module.css"),
      [],
    );
    assert.deepEqual(await reportedRules(["base", "tailwind"], "tailwind/clean.css"), []);
    assert.deepEqual(await reportedRules(["base", "tokens"], "tokens/clean.css"), []);
    // The tokens file sets the values, the fonts of @font-face among them, so the rules that ask for tokens skip it.
    assert.deepEqual(await reportedRules(["base", "tokens"], "tokens/tokens.css"), []);
  });

  await test("base reports each broken rule and each disable comment it refuses", async () => {
    assert.deepEqual(await reportedRules(["base"], "base/broken.css"), [
      "--report-descriptionless-disables",
      "--report-invalid-scope-disables",
      "--report-needless-disables",
      "--report-unscoped-disables",
      "color-hex-length",
      "declaration-block-no-duplicate-properties",
      "declaration-property-value-no-unknown",
      "selector-class-pattern",
      "value-keyword-case",
    ]);
  });

  await test("css-modules allows its syntax in a CSS module only", async () => {
    assert.deepEqual(await reportedRules(["base", "css-modules"], "css-modules/broken.css"), [
      "property-no-unknown",
      "selector-pseudo-class-no-unknown",
    ]);
    assert.deepEqual(
      await reportedRules(["base", "css-modules"], "css-modules/broken.module.css"),
      ["value-keyword-case"],
    );
  });

  await test("tailwind still reports an unknown at-rule, a url() import and a custom property out of pattern", async () => {
    assert.deepEqual(await reportedRules(["base", "tailwind"], "tailwind/broken.css"), [
      "at-rule-no-unknown",
      "custom-property-pattern",
      "import-notation",
    ]);
  });

  // The broken fixture lists each rule once, so one option of a rule could stop reporting while another keeps the rule
  // in the list. Each banned value is linted on its own and must be reported by its rule.
  await test("tokens reports each banned value by its rule", async () => {
    const banned: Record<string, string> = {
      "font-size: 13px": "declaration-property-unit-allowed-list",
      "font-size: 10pt": "declaration-property-unit-allowed-list",
      "font-size: 1.2rem": "declaration-property-unit-allowed-list",
      "border-radius: 4px": "declaration-property-unit-allowed-list",
      "border-radius: 1em": "declaration-property-unit-allowed-list",
      "font-weight: 600": "declaration-property-value-allowed-list",
      "font-weight: var(--fw, 600)": "declaration-property-value-allowed-list",
      "line-height: var(--lh, 1.4)": "declaration-property-value-allowed-list",
      "font-size: var(--fs, 13px)": "declaration-property-unit-allowed-list",
      "color: var(--text, #fff)": "color-no-hex",
      "color: var(--text, white)": "color-named",
      "--accent: white": "color-named",
      "line-height: 1.4": "declaration-property-value-allowed-list",
      "line-height: 20px": "declaration-property-value-allowed-list",
      "font: 600 14px/20px var(--sans)": "declaration-property-value-allowed-list",
      "color: #fff": "color-no-hex",
      "color: white": "color-named",
      "color: rgba(0 0 0 / 50%)": "function-disallowed-list",
      "color: hsl(0deg 0% 0%)": "function-disallowed-list",
      "color: oklch(70% 0.1 200deg)": "function-disallowed-list",
      "color: rgb(0 0 0)": "function-disallowed-list",
      "color: hsla(0deg 0% 0% / 50%)": "function-disallowed-list",
      "color: hwb(0deg 0% 0%)": "function-disallowed-list",
      "color: lab(50% 0 0)": "function-disallowed-list",
      "color: lch(50% 0 0deg)": "function-disallowed-list",
      "color: oklab(50% 0 0)": "function-disallowed-list",
      "color: color(display-p3 1 0 0)": "function-disallowed-list",
    };
    for (const [declaration, rule] of Object.entries(banned)) {
      // base may report the same value by its own rule too, such as rgba() as an alias of rgb().
      assert.ok((await reportedOn(`.panel {\n  ${declaration};\n}\n`)).includes(rule), declaration);
    }
    for (const media of [
      "(prefers-color-scheme: dark)",
      "(min-width: 600px)",
      "(max-width: 600px)",
      "(width <= 600px)",
    ]) {
      const css = `@media ${media} {\n  .panel {\n    color: var(--text);\n  }\n}\n`;
      assert.ok((await reportedOn(css)).includes("media-feature-name-disallowed-list"), media);
      // The tokens file is exempt from the value rules only: a second palette would be written exactly there.
      const inTokens = await reported(["base", "tokens"], {
        code: css,
        codeFilename: join(consumer, "src", "tokens.css"),
      });
      assert.ok(inTokens.includes("media-feature-name-disallowed-list"), `${media} in tokens.css`);
    }
    // A banned query named once in @custom-media would otherwise reach @media (--name) unseen.
    for (const query of [
      "(max-width: 600px)",
      "(prefers-color-scheme: dark)",
      "screen and (width <= 600px)",
    ]) {
      const css = `@custom-media --narrow ${query};\n`;
      assert.ok(
        (await reportedOn(css)).includes("kk-forge/custom-media-feature-name-disallowed-list"),
        `@custom-media ${query}`,
      );
    }
    // Case, a comment in the params and two banned features in one query: one report each time.
    for (const css of [
      "@CUSTOM-MEDIA --narrow (max-width: 600px);\n",
      "@custom-media --narrow /* phone */ (max-width: 600px);\n",
      "@custom-media --narrow (min-width: 1px) and (prefers-color-scheme: dark);\n",
    ]) {
      const { results } = await stylelint.lint({
        config: { extends: ["@kk-forge/stylelint-config/tokens"] },
        code: css,
        codeFilename: join(consumer, "src", "panel.css"),
      });
      const rules = results.flatMap((result) => result.warnings.map((warning) => warning.rule));
      assert.deepEqual(rules, ["kk-forge/custom-media-feature-name-disallowed-list"], css);
    }
    // A disable comment with its reason silences the plugin as it does a built-in rule.
    assert.deepEqual(
      await reportedOn(
        "/* stylelint-disable-next-line kk-forge/custom-media-feature-name-disallowed-list -- a popover follows the window */\n@custom-media --narrow (max-width: 600px);\n",
      ),
      [],
      "disabled @custom-media",
    );
    assert.deepEqual(
      await reportedOn("@custom-media --hover (hover: hover);\n"),
      [],
      "@custom-media (hover: hover)",
    );
    for (const allowed of [
      "border-radius: 50%",
      "font-size: smaller",
      "color: currentcolor",
      "color: transparent",
      "color: color-mix(in oklab, var(--a), transparent)",
      "font-size: 0",
      "font-weight: var(--fw, var(--fw-strong))",
      "line-height: var(--lh-body, var(--lh-ui))",
      "container-name: tan",
      "animation: navy 1s",
      "grid-area: red",
      "view-transition-name: navy",
      "content: counter(red)",
      "grid-row-start: navy",
      "font-weight: var(--fw,var(--fw-strong))",
    ]) {
      assert.deepEqual(await reportedOn(`.panel {\n  ${allowed};\n}\n`), [], allowed);
    }
  });

  await test("tokens reports a number where a token belongs, a second palette and a layout by the window", async () => {
    assert.deepEqual(await reportedRules(["base", "tokens"], "tokens/broken.css"), [
      "color-no-hex",
      "declaration-property-unit-allowed-list",
      "declaration-property-value-allowed-list",
      "function-disallowed-list",
      "media-feature-name-disallowed-list",
    ]);
  });
});
