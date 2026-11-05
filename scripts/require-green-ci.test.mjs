import { chmodSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

const script = fileURLToPath(new URL("./require-green-ci.sh", import.meta.url));
const sha = "3923924eaa3c200086edee87e8b2759c4fe35ffc";

function writeMock(dir, body) {
  const mock = join(dir, "gh");
  writeFileSync(mock, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(mock, 0o755);
  return mock;
}

function childEnv(mock, overrides = {}) {
  const env = {
    ...process.env,
    PATH: `${join(mock, "..")}:${process.env.PATH ?? ""}`,
    GH_BIN: mock,
    GITHUB_SHA: sha,
    GITHUB_REPOSITORY: "zedtech-fr/zedkit",
    GH_TOKEN: "test-token",
    REQUIRE_CI_POLL_SECONDS: "0",
    REQUIRE_CI_TIMEOUT_SECONDS: "0",
    REQUIRE_CI_SLEEP: "true",
    ...overrides,
  };
  for (const key of ["GITHUB_SHA", "GITHUB_REPOSITORY", "GH_TOKEN", "GITHUB_TOKEN"]) {
    if (key in overrides && !overrides[key]) delete env[key];
  }
  return env;
}

function run(overrides, ghBody) {
  const dir = mkdtempSync(join(tmpdir(), "require-green-ci-"));
  const mock = writeMock(dir, ghBody);
  return execFileSync("bash", [script], {
    encoding: "utf8",
    env: childEnv(mock, overrides),
  });
}

function throws(overrides, ghBody) {
  let captured = "";
  assert.throws(
    () => run(overrides, ghBody),
    (err) => {
      captured = `${err.stderr ?? ""}${err.stdout ?? ""}${err.message ?? ""}`;
      err.captured = captured;
      return true;
    },
  );
  return { captured };
}

const successList = JSON.stringify([
  {
    databaseId: 11,
    status: "completed",
    conclusion: "success",
    event: "push",
    headSha: sha,
    createdAt: "2026-11-05T10:39:53Z",
    workflowName: "ci",
    url: "https://github.com/zedtech-fr/zedkit/actions/runs/11",
  },
]);

const successJobs = JSON.stringify({
  jobs: [{ name: "ci-required", status: "completed", conclusion: "success" }],
});

test("fails closed without a commit SHA", () => {
  const err = throws({ GITHUB_SHA: "" }, "exit 0");
  assert.match(err.captured, /missing GITHUB_SHA/);
});

test("fails closed without a repository", () => {
  const err = throws({ GITHUB_REPOSITORY: "" }, "exit 0");
  assert.match(err.captured, /missing GITHUB_REPOSITORY/);
});

test("fails closed without a token", () => {
  const dir = mkdtempSync(join(tmpdir(), "require-green-ci-"));
  const mock = writeMock(dir, "exit 0");
  let captured = "";
  assert.throws(
    () =>
      execFileSync("bash", [script], {
        encoding: "utf8",
        env: {
          PATH: process.env.PATH ?? "/usr/bin",
          HOME: process.env.HOME ?? dir,
          GITHUB_SHA: sha,
          GITHUB_REPOSITORY: "zedtech-fr/zedkit",
          GH_BIN: mock,
          REQUIRE_CI_POLL_SECONDS: "0",
          REQUIRE_CI_TIMEOUT_SECONDS: "0",
          REQUIRE_CI_SLEEP: "true",
        },
      }),
    (err) => {
      captured = `${err.stderr ?? ""}${err.stdout ?? ""}${err.message ?? ""}`;
      return true;
    },
  );
  assert.match(captured, /missing GH_TOKEN/);
});

test("succeeds when ci and ci-required succeeded on the commit", () => {
  const out = run(
    {},
    `if [[ "$*" == *"run list"* ]]; then
  echo '${successList}'
  exit 0
fi
if [[ "$1" == "run" && "$2" == "view" ]]; then
  echo '${successJobs}'
  exit 0
fi
exit 1`,
  );
  assert.match(out, /job "ci-required" succeeded/);
});

test("fails immediately when ci already completed red", () => {
  const list = JSON.stringify([
    {
      databaseId: 42012582044,
      status: "completed",
      conclusion: "failure",
      event: "push",
      headSha: sha,
      createdAt: "2026-11-05T10:39:53Z",
      workflowName: "ci",
      url: "https://github.com/zedtech-fr/zedkit/actions/runs/42012582044",
    },
  ]);
  const err = throws(
    {},
    `if [[ "$*" == *"run list"* ]]; then echo '${list}'; exit 0; fi; exit 1`,
  );
  assert.match(err.captured, /run 42012582044 conclusion is failure/);
});

test("fails when ci succeeded but ci-required was skipped", () => {
  const jobs = JSON.stringify({
    jobs: [{ name: "ci-required", status: "completed", conclusion: "skipped" }],
  });
  const err = throws(
    {},
    `if [[ "$*" == *"run list"* ]]; then echo '${successList}'; exit 0; fi
if [[ "$1" == "run" && "$2" == "view" ]]; then echo '${jobs}'; exit 0; fi
exit 1`,
  );
  assert.match(err.captured, /job "ci-required" on run 11 conclusion is skipped/);
});

test("fails when ci succeeded but ci-required is missing", () => {
  const jobs = JSON.stringify({ jobs: [{ name: "checks", conclusion: "success" }] });
  const err = throws(
    {},
    `if [[ "$*" == *"run list"* ]]; then echo '${successList}'; exit 0; fi
if [[ "$1" == "run" && "$2" == "view" ]]; then echo '${jobs}'; exit 0; fi
exit 1`,
  );
  assert.match(err.captured, /job "ci-required" on run 11 conclusion is missing/);
});

test("waits through an in-flight run then accepts success", () => {
  const dir = mkdtempSync(join(tmpdir(), "require-green-ci-"));
  const inflight = JSON.stringify([
    {
      databaseId: 12,
      status: "in_progress",
      conclusion: "",
      event: "push",
      headSha: sha,
      createdAt: "2026-11-05T10:39:53Z",
      workflowName: "ci",
      url: "https://github.com/zedtech-fr/zedkit/actions/runs/12",
    },
  ]);
  const mock = writeMock(
    dir,
    `f="${join(dir, "count")}"
n=$(cat "$f" 2>/dev/null || echo 0)
if [[ "$*" == *"run list"* ]]; then
  n=$((n + 1))
  echo "$n" > "$f"
  if [ "$n" -eq 1 ]; then
    echo '${inflight}'
  else
    echo '${successList}'
  fi
  exit 0
fi
if [[ "$1" == "run" && "$2" == "view" ]]; then
  echo '${successJobs}'
  exit 0
fi
exit 1`,
  );
  const out = execFileSync("bash", [script], {
    encoding: "utf8",
    env: childEnv(mock, { REQUIRE_CI_TIMEOUT_SECONDS: "30" }),
  });
  assert.match(out, /job "ci-required" succeeded/);
});

test("times out when no ci run appears", () => {
  const err = throws(
    { REQUIRE_CI_TIMEOUT_SECONDS: "0" },
    `if [[ "$*" == *"run list"* ]]; then echo '[]'; exit 0; fi; exit 1`,
  );
  assert.match(err.captured, /timed out waiting for workflow "ci"/);
});
