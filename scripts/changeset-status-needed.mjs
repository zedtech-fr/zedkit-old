/**
 * Whether `changeset status` should run on this PR.
 * A consumed Changesets version commit bumps package.json / CHANGELOG only
 * and leaves no .changeset/*.md, so `status` would fail even though the
 * bump is the release. Source edits without a changeset still return "run".
 */
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RELEASE_PATH = /^(packages|apps)\/[^/]+\/(package\.json|CHANGELOG\.md)$/;

/** @param {{ pendingChangesetFiles: string[], changedPackageAppPaths: string[] }} input */
export function changesetStatusVerdict({ pendingChangesetFiles, changedPackageAppPaths }) {
  if (changedPackageAppPaths.length === 0) return "skip-unchanged";
  if (pendingChangesetFiles.length > 0) return "run";
  const versionOnly = changedPackageAppPaths.every((path) => RELEASE_PATH.test(path));
  return versionOnly ? "skip-version-delta" : "run";
}

function fromGit() {
  const diff = execFileSync("git", ["diff", "--name-only", "--no-renames", "origin/main...HEAD", "--", "packages", "apps"], {
    encoding: "utf8",
  });
  const changedPackageAppPaths = diff.split("\n").map((line) => line.trim()).filter(Boolean);
  const pendingChangesetFiles = readdirSync(".changeset").filter((name) => name.endsWith(".md"));
  return changesetStatusVerdict({ pendingChangesetFiles, changedPackageAppPaths });
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.stdout.write(`${fromGit()}\n`);
