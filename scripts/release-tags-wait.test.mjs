import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const lib = fileURLToPath(new URL("./release-tags-lib.sh", import.meta.url));
const root = fileURLToPath(new URL("..", import.meta.url));

function runWait(env, extra = "") {
  return execFileSync(
    "bash",
    [
      "-c",
      `set -euo pipefail
source "${lib}"
${extra}
wait_for_npm_version "@example/pkg@1.0.0"`,
    ],
    { encoding: "utf8", env: { ...process.env, ...env } },
  );
}

test("wait_for_npm_version succeeds when npm view succeeds immediately", () => {
  runWait({ RELEASE_TAGS_NPM_VIEW: "true", RELEASE_TAGS_NPM_MAX_ATTEMPTS: "3" });
});

test("wait_for_npm_version retries until npm view succeeds", () => {
  const dir = mkdtempSync(join(tmpdir(), "release-tags-wait-"));
  const mock = join(dir, "npm-view-mock.sh");
  writeFileSync(
    mock,
    `#!/usr/bin/env bash
f="${join(dir, "count")}"
n=$(cat "$f" 2>/dev/null || echo 0)
n=$((n + 1))
echo "$n" > "$f"
[ "$n" -ge 2 ] && exit 0
exit 1`,
  );
  chmodSync(mock, 0o755);
  runWait({
    RELEASE_TAGS_NPM_VIEW: mock,
    RELEASE_TAGS_NPM_MAX_ATTEMPTS: "5",
    RELEASE_TAGS_NPM_SLEEP_SEC: "0",
  });
});

test("wait_for_npm_version fails with clear error after max attempts", () => {
  assert.throws(
    () =>
      runWait({
        RELEASE_TAGS_NPM_VIEW: "false",
        RELEASE_TAGS_NPM_MAX_ATTEMPTS: "3",
        RELEASE_TAGS_NPM_SLEEP_SEC: "0",
      }),
    (err) => {
      assert.match(String(err.stderr), /npm registry: @example\/pkg@1\.0\.0 not visible after 3 attempts/);
      return true;
    },
  );
});

test("release-tags.sh --dry-run accepts flag", () => {
  const out = execFileSync("bash", [join(root, "scripts/release-tags.sh"), "--dry-run"], {
    encoding: "utf8",
    env: {
      ...process.env,
      RELEASE_TAGS_NPM_VIEW: "false",
      RELEASE_TAGS_NPM_MAX_ATTEMPTS: "1",
      RELEASE_TAGS_NPM_SLEEP_SEC: "0",
    },
  });
  assert.match(out, /skip @zedtech\//);
});

test("release-tags.sh exits when publishedPackages is empty (CI no-op)", () => {
  const out = execFileSync("bash", [join(root, "scripts/release-tags.sh")], {
    encoding: "utf8",
    env: {
      ...process.env,
      RELEASE_TAGS_PUBLISHED: "[]",
    },
  });
  assert.match(out, /nothing to do/);
});

test("release-tags.sh dry-run honors publishedPackages list only", () => {
  const out = execFileSync("bash", [join(root, "scripts/release-tags.sh"), "--dry-run"], {
    encoding: "utf8",
    env: {
      ...process.env,
      RELEASE_TAGS_PUBLISHED: '[{"name":"@zedtech/zedkit-core","version":"9.9.9"}]',
      RELEASE_TAGS_NPM_VIEW: "false",
      RELEASE_TAGS_NPM_MAX_ATTEMPTS: "1",
      RELEASE_TAGS_NPM_SLEEP_SEC: "0",
    },
  });
  assert.match(out, /skip @zedtech\/zedkit-core@9\.9\.9/);
  assert.doesNotMatch(out, /skip @zedtech\/zedkit-server@/);
});
