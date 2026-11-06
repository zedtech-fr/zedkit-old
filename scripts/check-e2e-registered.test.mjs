import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const script = join(root, "scripts/check-e2e-registered.sh");

function run(specsDir) {
  return spawnSync("bash", [script], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, SPECS_DIR: specsDir },
  });
}

describe("check-e2e-registered origin scan", () => {
  it("fails when a spec embeds 127.0.0.1", () => {
    const dir = mkdtempSync(join(tmpdir(), "e2e-origin-"));
    writeFileSync(join(dir, "x.spec.ts"), 'const BASE = "http://127.0.0.1:3100";\n');
    const result = run(dir);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /spec origin/);
  });

  it("fails when a spec embeds localhost:", () => {
    const dir = mkdtempSync(join(tmpdir(), "e2e-origin-"));
    writeFileSync(join(dir, "x.spec.ts"), 'await page.goto("http://localhost:3100/");\n');
    const result = run(dir);
    assert.notEqual(result.status, 0);
    assert.match(`${result.stdout}${result.stderr}`, /spec origin/);
  });

  it("passes when specs use relative paths", () => {
    const dir = mkdtempSync(join(tmpdir(), "e2e-origin-"));
    writeFileSync(join(dir, "x.spec.ts"), 'await page.goto("/");\n');
    const result = run(dir);
    assert.equal(result.status, 0, `${result.stdout}${result.stderr}`);
  });
});
