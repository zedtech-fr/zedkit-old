/**
 * Whether `changeset status` should run on this PR.
 * A consumed Changesets version commit bumps package.json version (and
 * internal @zedtech/zedkit-* dependency ranges) plus CHANGELOG, and leaves
 * no .changeset/*.md, so `status` would fail even though the bump is the
 * release. Source edits, script changes, or external dependency edits
 * without a changeset still return "run".
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RELEASE_PATH = /^(packages|apps)\/[^/]+\/(package\.json|CHANGELOG\.md)$/;
const DEP_FIELDS = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
const NUMBERED_RANGE = /^([\^~]?)([0-9]+)\.([0-9]+)\.([0-9]+)$/;

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function sameKeys(left, right) {
  const keys = Object.keys(left);
  return keys.length === Object.keys(right).length && keys.every((key) => Object.hasOwn(right, key));
}

function parseSemver(value) {
  if (typeof value !== "string") return null;
  const match = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/.exec(value);
  if (!match) return null;
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

/** @param {unknown} from @param {unknown} to */
export function isSemverBump(from, to) {
  const start = parseSemver(from);
  const end = parseSemver(to);
  if (!start || !end) return false;
  if (end.major !== start.major) return end.major > start.major;
  if (end.minor !== start.minor) return end.minor > start.minor;
  return end.patch > start.patch;
}

function isInternalName(name) {
  return typeof name === "string" && name.startsWith("@zedtech/zedkit-");
}

function isInternalDepBump(from, to) {
  const start = NUMBERED_RANGE.exec(from);
  const end = NUMBERED_RANGE.exec(to);
  if (!start || !end) return false;
  return isSemverBump(`${start[2]}.${start[3]}.${start[4]}`, `${end[2]}.${end[3]}.${end[4]}`);
}

function isGeneratedReleaseDepMap(before, after) {
  if (!isPlainObject(before) || !isPlainObject(after) || !sameKeys(before, after)) return false;
  for (const name of Object.keys(before)) {
    if (before[name] === after[name]) continue;
    if (!isInternalName(name) || !isInternalDepBump(before[name], after[name])) return false;
  }
  return true;
}

/** True when `after` is a Changesets version-commit package.json relative to `before`. */
export function isGeneratedReleasePackageJson(before, after) {
  if (!isPlainObject(before) || !isPlainObject(after) || !sameKeys(before, after)) return false;
  if (!isSemverBump(before.version, after.version)) return false;
  for (const key of Object.keys(before)) {
    if (key === "version") continue;
    if (DEP_FIELDS.includes(key)) {
      if (!isGeneratedReleaseDepMap(before[key], after[key])) return false;
      continue;
    }
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) return false;
  }
  return true;
}

/**
 * @param {{
 *   pendingChangesetFiles: string[],
 *   changedPackageAppPaths: string[],
 *   packageJsonChanges?: { path: string, before: unknown, after: unknown }[],
 * }} input
 */
export function changesetStatusVerdict({ pendingChangesetFiles, changedPackageAppPaths, packageJsonChanges = [] }) {
  if (changedPackageAppPaths.length === 0) return "skip-unchanged";
  if (pendingChangesetFiles.length > 0) return "run";
  if (!changedPackageAppPaths.every((path) => RELEASE_PATH.test(path))) return "run";
  const jsonPaths = changedPackageAppPaths.filter((path) => path.endsWith("/package.json"));
  if (jsonPaths.length === 0) return "run";
  const byPath = new Map(packageJsonChanges.map((change) => [change.path, change]));
  for (const path of jsonPaths) {
    const change = byPath.get(path);
    if (!change || !isGeneratedReleasePackageJson(change.before, change.after)) return "run";
  }
  return "skip-version-delta";
}

function gitShow(ref, file, cwd) {
  const result = spawnSync("git", ["show", `${ref}:${file}`], { cwd, encoding: "utf8" });
  if (result.status !== 0) return null;
  return result.stdout;
}

function parseJson(text) {
  if (typeof text !== "string" || text.trim() === "") return null;
  return JSON.parse(text);
}

export function fromGit(cwd = process.cwd()) {
  const diff = execFileSync(
    "git",
    ["diff", "--name-only", "--no-renames", "origin/main...HEAD", "--", "packages", "apps"],
    { cwd, encoding: "utf8" },
  );
  const changedPackageAppPaths = diff
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const changesetDir = join(cwd, ".changeset");
  const pendingChangesetFiles = existsSync(changesetDir)
    ? readdirSync(changesetDir).filter((name) => name.endsWith(".md"))
    : [];
  const packageJsonChanges = changedPackageAppPaths
    .filter((path) => path.endsWith("/package.json"))
    .map((path) => ({
      path,
      before: parseJson(gitShow("origin/main", path, cwd)),
      after: parseJson(gitShow("HEAD", path, cwd)),
    }));
  return changesetStatusVerdict({ pendingChangesetFiles, changedPackageAppPaths, packageJsonChanges });
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) process.stdout.write(`${fromGit()}\n`);
