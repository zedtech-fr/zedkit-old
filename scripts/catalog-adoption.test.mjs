import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { parseAdoption } from "./catalog.mjs";

/** Builds the `field(name)` lookup the catalog parser hands to parseAdoption. */
function fields(values) {
  return (name) => values[name] ?? null;
}

function parse(importLine, values = {}) {
  const errors = [];
  const adoption = parseAdoption("Need", importLine, fields(values), "CATALOG.md", errors);
  return { adoption, errors };
}

test("a JavaScript import line lists exports, nothing else", () => {
  const { adoption, errors } = parse("`@zedtech/zedkit-ui` — `Button`, `buttonVariants`, `ButtonProps`");
  assert.deepEqual(errors, []);
  assert.deepEqual(adoption, {
    kind: "js",
    modules: [{ from: "@zedtech/zedkit-ui", exports: ["Button", "buttonVariants", "ButtonProps"] }],
  });
});

test("an import line can name several modules", () => {
  const { adoption, errors } = parse(
    "`@zedtech/zedkit-nest` — `createNestApp`, `ErrorBody`; `@zedtech/zedkit-core` — `newPrefixedId`",
  );
  assert.deepEqual(errors, []);
  assert.deepEqual(adoption.modules, [
    { from: "@zedtech/zedkit-nest", exports: ["createNestApp", "ErrorBody"] },
    { from: "@zedtech/zedkit-core", exports: ["newPrefixedId"] },
  ]);
});

test("a stylesheet is a CSS import and a directive, never a JavaScript export", () => {
  const { adoption, errors } = parse("`@zedtech/zedkit-ui/styles.css` (stylesheet, not a JavaScript module)", {
    "CSS import": "`@zedtech/zedkit-ui/styles.css`",
    "CSS directive": '`@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}"`',
    "Also install": "`next-themes`",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(adoption, {
    kind: "css",
    imports: ["@zedtech/zedkit-ui/styles.css"],
    directives: ['@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}"'],
    install: ["next-themes"],
    utilities: [],
    attributes: [],
  });
});

test("utilities and attributes are classes and markup, not imports", () => {
  const { adoption, errors } = parse("`@zedtech/zedkit-ui/styles.css` (stylesheet)", {
    "CSS import": "`@zedtech/zedkit-ui/styles.css`",
    "CSS directive": '`@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}"`',
    Utilities: "`animate-fade-up`, `stagger-*`",
    Attributes: "`data-reveal`, `data-stagger`",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(adoption.utilities, ["animate-fade-up", "stagger-*"]);
  assert.deepEqual(adoption.attributes, ["data-reveal", "data-stagger"]);
});

test("a package bin is a command, not a JavaScript export", () => {
  const { adoption, errors } = parse("`@zedtech/zedkit-quality` (CLI bin, not a JavaScript module)", {
    Bin: "`zedkit-sync-env`",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(adoption, { kind: "bin", commands: ["zedkit-sync-env"] });
});

test("a config file is extended, not imported", () => {
  const { adoption, errors } = parse("`@zedtech/zedkit-quality/tsconfig` (tsconfig preset)", {
    Extends: "`@zedtech/zedkit-quality/tsconfig`",
  });
  assert.deepEqual(errors, []);
  assert.deepEqual(adoption, { kind: "config", extends: "@zedtech/zedkit-quality/tsconfig" });
});

test("an Import line that is neither exports nor typed is an error, not a guess", () => {
  const { errors } = parse("`@zedtech/zedkit-ui/styles.css` (+ one `@source` line, see README)");
  assert.equal(errors.length, 1);
  assert.match(errors[0], /Need/);
  assert.match(errors[0], /CSS import|Extends/);
});

test("a CSS import must name a stylesheet and a directive must be an at-rule", () => {
  const notCss = parse("`@zedtech/zedkit-ui`", { "CSS import": "`@zedtech/zedkit-ui`" });
  assert.match(notCss.errors.join("\n"), /\.css/);
  const notRule = parse("`pkg/x.css`", { "CSS import": "`pkg/x.css`", "CSS directive": "`source ./x`" });
  assert.match(notRule.errors.join("\n"), /at-rule|@/);
});

test("the published catalog types every need and keeps stylesheets out of the export lists", () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const catalog = JSON.parse(readFileSync(join(root, "docs/catalog/catalog.json"), "utf8"));
  let seen = 0;
  for (const [pkg, entry] of Object.entries(catalog.packages)) {
    for (const need of entry.needs) {
      seen += 1;
      assert.ok(need.adoption, `${pkg}: "${need.need}" has no adoption contract`);
      if (need.adoption.kind === "js") {
        for (const { exports } of need.adoption.modules) {
          for (const name of exports) {
            assert.match(name, /^[A-Za-z_$][\w$]*$/, `${pkg}: "${need.need}" export "${name}" is not an identifier`);
          }
        }
      }
    }
  }
  assert.ok(seen > 100);
});
