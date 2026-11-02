import assert from "node:assert/strict";
import test from "node:test";
import { groupCatalogResults } from "../lib/catalog-result-groups.mjs";

/** @param {string} pkg @param {import("../content/catalog-index").CatalogArea} area */
const row = (pkg, area = "ui", title = pkg) => ({
  href: `/docs/${pkg}/x`,
  title,
  need: title,
  status: "beta",
  area,
  package: pkg,
});

test("groupCatalogResults orders UI before Core & server and buckets by catalog area", () => {
  const groups = groupCatalogResults([
    row("server", "backend"),
    row("ui", "ui"),
    row("flags", "backend"),
  ]);
  assert.deepEqual(
    groups.map((g) => g.id),
    ["ui", "backend"],
  );
  assert.equal(groups[1].entries[0].package, "server");
  assert.equal(groups[1].entries[1].package, "flags");
});

test("single-area filter yields one group heading", () => {
  const groups = groupCatalogResults([row("ui", "ui", "a"), row("ui", "ui", "b")]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].label, "UI");
  assert.equal(groups[0].entries.length, 2);
});

test("throws on an unmapped catalog area", () => {
  assert.throws(
    () =>
      groupCatalogResults([
        {
          ...row("ui", "ui"),
          area: /** @type {import("../content/catalog-index").CatalogArea} */ ("unknown"),
        },
      ]),
    /unmapped catalog area "unknown"/,
  );
});
