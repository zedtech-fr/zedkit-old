import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const app = join(dirname(fileURLToPath(import.meta.url)), "..");
const script = join(app, "scripts/check-raw-css-values.mjs");

function run(cwd) {
  return execFileSync("node", [script, cwd === app ? undefined : cwd].filter(Boolean), {
    cwd: app,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

test("tokenised font-size and duration pass; raw rem/ms/clamp fail", () => {
  const dir = mkdtempSync(join(tmpdir(), "zk-raw-css-"));
  writeFileSync(
    join(dir, "ok.css"),
    ":root { --zk-type-h1-size: 2rem; --motion-base: 150ms; }\n.h { font-size: var(--zk-type-h1-size); transition-duration: var(--motion-base); }\n",
  );
  assert.equal(run(dir), "");

  writeFileSync(join(dir, "bad.css"), ".h { font-size: 2rem; animation-duration: 200ms; }\n");
  assert.throws(() => run(dir), /font-size: 2rem[\s\S]*animation-duration: 200ms/);
});

test("check-raw-css-values passes on the docs app tree", () => {
  assert.equal(run(app), "");
});
