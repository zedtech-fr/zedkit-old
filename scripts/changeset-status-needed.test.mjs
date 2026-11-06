import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  changesetStatusVerdict,
  fromGit,
  isGeneratedReleasePackageJson,
} from "./changeset-status-needed.mjs";

const script = fileURLToPath(new URL("./changeset-status-needed.mjs", import.meta.url));

const AI_PKG = "packages/ai/package.json";
const AI_LOG = "packages/ai/CHANGELOG.md";
const UI_PKG = "packages/ui/package.json";
const UI_LOG = "packages/ui/CHANGELOG.md";

const VERSION_DELTA = [AI_PKG, AI_LOG, UI_PKG, UI_LOG];

function versionChange(path, from, to, extraBefore = {}, extraAfter = extraBefore) {
  return {
    path,
    before: { name: "@zedtech/zedkit-ai", version: from, ...extraBefore },
    after: { name: "@zedtech/zedkit-ai", version: to, ...extraAfter },
  };
}

const VERSION_CHANGES = [
  versionChange(AI_PKG, "0.21.0", "1.0.0"),
  versionChange(UI_PKG, "1.9.0", "1.9.1"),
];

test("consumed version delta (version bump + CHANGELOG only, no pending changesets) skips", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: VERSION_DELTA,
      packageJsonChanges: VERSION_CHANGES,
    }),
    "skip-version-delta",
  );
});

test("an app package.json version bump + CHANGELOG with no pending changeset is a version delta", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: ["apps/docs/package.json", "apps/docs/CHANGELOG.md"],
      packageJsonChanges: [versionChange("apps/docs/package.json", "0.1.0", "0.1.1")],
    }),
    "skip-version-delta",
  );
});

test("internal @zedtech/zedkit-* dependency range bumps next to a version bump skip", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: [UI_PKG, UI_LOG],
      packageJsonChanges: [
        versionChange(
          UI_PKG,
          "1.9.0",
          "1.9.1",
          { dependencies: { "@zedtech/zedkit-i18n": "^0.4.0", react: "19.0.0" } },
          { dependencies: { "@zedtech/zedkit-i18n": "^0.4.1", react: "19.0.0" } },
        ),
      ],
    }),
    "skip-version-delta",
  );
});

test("filenames matching a version delta still run without semantic package.json payloads", () => {
  assert.equal(
    changesetStatusVerdict({ pendingChangesetFiles: [], changedPackageAppPaths: VERSION_DELTA }),
    "run",
  );
});

test("CHANGELOG-only paths without a package.json version bump still run", () => {
  assert.equal(
    changesetStatusVerdict({ pendingChangesetFiles: [], changedPackageAppPaths: [AI_LOG] }),
    "run",
  );
});

test("source change with no changeset still runs (the gate that must fail)", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: ["packages/ai/src/index.ts"],
    }),
    "run",
  );
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [],
      changedPackageAppPaths: [...VERSION_DELTA, "packages/ai/src/bin.ts"],
      packageJsonChanges: VERSION_CHANGES,
    }),
    "run",
  );
});

test("a pending changeset always runs, including on version-shaped paths", () => {
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [".changeset/fix.md"],
      changedPackageAppPaths: ["packages/ai/src/index.ts"],
    }),
    "run",
  );
  assert.equal(
    changesetStatusVerdict({
      pendingChangesetFiles: [".changeset/fix.md"],
      changedPackageAppPaths: VERSION_DELTA,
      packageJsonChanges: VERSION_CHANGES,
    }),
    "run",
  );
});

test("no package or app changes skips (does not replace the gate with a blanket skip)", () => {
  assert.equal(
    changesetStatusVerdict({ pendingChangesetFiles: [], changedPackageAppPaths: [] }),
    "skip-unchanged",
  );
});

test("scripts, external deps, added keys, and version downgrades are not a generated release", () => {
  assert.equal(
    isGeneratedReleasePackageJson(
      { name: "@zedtech/zedkit-ai", version: "0.21.0" },
      { name: "@zedtech/zedkit-ai", version: "1.0.0", scripts: { postinstall: "echo pwned" } },
    ),
    false,
  );
  assert.equal(
    isGeneratedReleasePackageJson(
      { name: "@zedtech/zedkit-ai", version: "0.21.0", dependencies: { leftpad: "1.0.0" } },
      { name: "@zedtech/zedkit-ai", version: "1.0.0", dependencies: { leftpad: "1.0.1" } },
    ),
    false,
  );
  assert.equal(
    isGeneratedReleasePackageJson(
      { name: "@zedtech/zedkit-ai", version: "0.21.0", dependencies: { "@zedtech/zedkit-core": "^0.9.0" } },
      {
        name: "@zedtech/zedkit-ai",
        version: "1.0.0",
        dependencies: { "@zedtech/zedkit-core": "^0.9.0", "@zedtech/zedkit-ui": "^1.9.1" },
      },
    ),
    false,
  );
  assert.equal(isGeneratedReleasePackageJson({ version: "1.0.0" }, { version: "0.9.0" }), false);
  assert.equal(isGeneratedReleasePackageJson({ version: "1.0.0" }, { version: "1.0.0" }), false);
  assert.equal(isGeneratedReleasePackageJson(null, { version: "1.0.1" }), false);
});

test("version-only and version-plus-internal-range bumps are generated releases", () => {
  assert.equal(
    isGeneratedReleasePackageJson({ name: "@zedtech/zedkit-ai", version: "0.21.0" }, { name: "@zedtech/zedkit-ai", version: "1.0.0" }),
    true,
  );
  assert.equal(
    isGeneratedReleasePackageJson(
      { version: "0.3.14", dependencies: { "@zedtech/zedkit-ui": "^1.9.0" } },
      { version: "0.3.15", dependencies: { "@zedtech/zedkit-ui": "^1.9.1" } },
    ),
    true,
  );
  assert.equal(
    isGeneratedReleasePackageJson(
      { version: "0.21.0", dependencies: { "@zedtech/zedkit-core": "workspace:*" } },
      { version: "1.0.0", dependencies: { "@zedtech/zedkit-core": "workspace:*" } },
    ),
    true,
  );
});

function git(cwd, args) {
  return execFileSync("git", ["-c", "commit.gpgsign=false", ...args], { cwd, encoding: "utf8" });
}

function write(cwd, path, body) {
  mkdirSync(join(cwd, dirname(path)), { recursive: true });
  writeFileSync(join(cwd, path), body);
}

function makeRepo() {
  const cwd = mkdtempSync(join(tmpdir(), "zk-changeset-status-"));
  git(cwd, ["init", "-b", "main"]);
  git(cwd, ["config", "user.email", "dev@example.com"]);
  git(cwd, ["config", "user.name", "dev"]);
  write(cwd, AI_PKG, `${JSON.stringify({ name: "@zedtech/zedkit-ai", version: "0.21.0" }, null, 2)}\n`);
  write(cwd, ".changeset/config.json", "{}\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "base"]);
  git(cwd, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  return cwd;
}

function runCli(cwd) {
  return execFileSync(process.execPath, [script], { cwd, encoding: "utf8" }).trim();
}

function commitVersion(cwd, extra) {
  write(cwd, AI_PKG, `${JSON.stringify({ name: "@zedtech/zedkit-ai", version: "1.0.0", ...extra }, null, 2)}\n`);
  write(cwd, AI_LOG, "## 1.0.0\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "chore: version packages"]);
}

test("CLI on an isolated repo matching origin/main is skip-unchanged (main CI)", () => {
  const cwd = makeRepo();
  const out = runCli(cwd);
  assert.equal(fromGit(cwd), "skip-unchanged");
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "skip-unchanged");
});

test("CLI on an isolated consumed version commit is skip-version-delta", () => {
  const cwd = makeRepo();
  commitVersion(cwd, {});
  const out = runCli(cwd);
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "skip-version-delta");
});

test("CLI runs for a source edit with no changeset", () => {
  const cwd = makeRepo();
  write(cwd, "packages/ai/src/index.ts", "export {}\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "feat: source"]);
  const out = runCli(cwd);
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "run");
});

test("CLI runs when package.json scripts change next to a version bump", () => {
  const cwd = makeRepo();
  commitVersion(cwd, { scripts: { postinstall: "echo pwned" } });
  const out = runCli(cwd);
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "run");
});

test("CLI runs when an external dependency changes next to a version bump", () => {
  const cwd = makeRepo();
  commitVersion(cwd, { dependencies: { leftpad: "1.0.1" } });
  const out = runCli(cwd);
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "run");
});

test("CLI runs when a pending changeset file is present", () => {
  const cwd = makeRepo();
  commitVersion(cwd, {});
  write(cwd, ".changeset/fix.md", "---\n'@zedtech/zedkit-ai': patch\n---\n\nfix\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "changeset"]);
  const out = runCli(cwd);
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "run");
});

test("CLI skips a version bump that also bumps an internal dependency range", () => {
  const cwd = makeRepo();
  write(
    cwd,
    AI_PKG,
    `${JSON.stringify({ name: "@zedtech/zedkit-ai", version: "0.21.0", dependencies: { "@zedtech/zedkit-core": "^0.9.0" } }, null, 2)}\n`,
  );
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "pin"]);
  git(cwd, ["update-ref", "refs/remotes/origin/main", "HEAD"]);
  write(
    cwd,
    AI_PKG,
    `${JSON.stringify({ name: "@zedtech/zedkit-ai", version: "1.0.0", dependencies: { "@zedtech/zedkit-core": "^0.9.1" } }, null, 2)}\n`,
  );
  write(cwd, AI_LOG, "## 1.0.0\n");
  git(cwd, ["add", "."]);
  git(cwd, ["commit", "-m", "chore: version packages"]);
  const out = runCli(cwd);
  rmSync(cwd, { recursive: true, force: true });
  assert.equal(out, "skip-version-delta");
});
