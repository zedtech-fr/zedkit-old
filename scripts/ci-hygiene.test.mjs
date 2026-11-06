import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const workflow = readFileSync(join(root, ".github/workflows/ci.yml"), "utf8");
// The `hygiene:` job block: from its key to the next two-space job key.
const hygiene = workflow.split(/^ {2}hygiene:/m)[1]?.split(/^ {2}\S/m)[0] ?? "";

describe("ci hygiene job", () => {
  it("no longer invokes check-pr-lenses", () => {
    assert.ok(!workflow.includes("check-pr-lenses"), "ci.yml still references check-pr-lenses");
    assert.ok(!existsSync(join(root, "scripts/check-pr-lenses.sh")), "scripts/check-pr-lenses.sh still exists");
  });

  it("keeps the other hygiene scripts", () => {
    assert.notEqual(hygiene, "", "hygiene job block not found in ci.yml");
    for (const script of [
      "scripts/check-no-artifacts.sh",
      "scripts/check-no-private-refs.sh",
      "scripts/check-tone.sh",
      "scripts/check-dependabot.sh",
      "scripts/check-breaking-changeset.sh",
      "scripts/check-changeset-packages.sh",
    ]) {
      assert.ok(hygiene.includes(script), `hygiene job lost ${script}`);
    }
  });
});

describe("pr template", () => {
  it("has no mandatory Lenses/Personas tables", () => {
    const template = readFileSync(join(root, ".github/pull_request_template.md"), "utf8");
    assert.ok(!template.includes("Lenses run"), "template still has a Lenses run table");
    assert.ok(!template.includes("## Personas"), "template still has a Personas section");
    assert.ok(!/at least five/i.test(template), "template still demands five personas");
    assert.match(template, /1[–-]3/, "template does not require 1–3 reviews");
  });
});
