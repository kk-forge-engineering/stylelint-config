import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, suite, test } from "node:test";
import { fileURLToPath } from "node:url";
import stylelint from "stylelint";

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
// stylelint resolves `extends` from the working directory. In this repo the
// package's own name resolves to its source. The test works from the consumer
// so that stylelint reads only the unpacked tarball.
process.chdir(consumer);

/**
 * Returns the sorted rules that the presets report on the fixture, each once.
 * A parse error or an invalid option counts by its message text.
 */
async function reportedRules(presets: string[], fixture: string): Promise<string[]> {
  const { results } = await stylelint.lint({
    config: { extends: presets.map((preset) => `@kk-forge/stylelint-config/${preset}`) },
    files: fileURLToPath(new URL(`fixtures/${fixture}`, import.meta.url)),
  });
  const rules = results.flatMap((result) => [
    ...result.warnings.map((warning) => warning.rule),
    ...result.parseErrors.map((error) => error.text),
    ...result.invalidOptionWarnings.map((warning) => warning.text),
  ]);
  return [...new Set(rules)].toSorted((left, right) => left.localeCompare(right));
}

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
    ]);
  });

  await test("css-modules allows its syntax in a CSS module only", async () => {
    assert.deepEqual(await reportedRules(["base", "css-modules"], "css-modules/broken.css"), [
      "property-no-unknown",
      "selector-pseudo-class-no-unknown",
    ]);
  });

  await test("tailwind still reports an unknown at-rule, a url() import and a custom property out of pattern", async () => {
    assert.deepEqual(await reportedRules(["base", "tailwind"], "tailwind/broken.css"), [
      "at-rule-no-unknown",
      "custom-property-pattern",
      "import-notation",
    ]);
  });
});
