// Original work by the same author.
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { tryCatch } from "@zedtech/zedkit-core";

/** One slice of the repo for one read-only reader: the paths it covers and how many files they hold. */
export type Slice = { paths: string[]; files: number };
export type Scan = { files: number; size: "small" | "medium" | "large"; readers: number; slices: Slice[] };

// Not code a reader should spend tokens on: dependencies, build output, the
// kit's own folders, binary assets, lockfiles.
const SKIP_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "out", "coverage", "vendor", ".turbo", "target",
  ".agents", ".cursor", ".claude",
]);
const SKIP_FILES = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lock"]);
const SKIP_EXT = /\.(png|jpe?g|gif|webp|ico|svg|woff2?|ttf|eot|mp4|mp3|pdf|zip|gz|lockb|map|snap)$/iu;

function gitEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env.GIT_DIR;
  delete env.GIT_WORK_TREE;
  return env;
}

function walk(root: string, rel: string, skipDir: (name: string) => boolean): string[] {
  const entries = tryCatch(() => readdirSync(join(root, rel), { withFileTypes: true }));
  if (!entries.ok) return [];
  return entries.value.flatMap((entry) => {
    const path = rel === "" ? entry.name : `${rel}/${entry.name}`;
    if (entry.isDirectory()) return skipDir(entry.name) ? [] : walk(root, path, skipDir);
    return entry.isFile() ? [path] : [];
  });
}

const KIT_DIRS = new Set([".agents", ".cursor", ".claude"]);

/**
 * Repo-relative code and doc paths: git (tracked + untracked, ignore rules honoured), else a directory walk.
 * `withProviderDirs` keeps `.agents/`, `.cursor/` and `.claude/` (for finding existing provider rules).
 */
export function listRepoFiles(root: string, withProviderDirs = false): string[] {
  const skipDir = (name: string): boolean => SKIP_DIRS.has(name) && !(withProviderDirs && KIT_DIRS.has(name));
  const git = tryCatch(() =>
    execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], {
      cwd: root,
      encoding: "utf8",
      env: gitEnv(),
      maxBuffer: 256 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    }),
  );
  const all = git.ok ? git.value.split("\0").filter((p) => p !== "") : walk(root, "", skipDir);
  return all.filter((path) => {
    const parts = path.split("/");
    return !parts.some(skipDir) && !SKIP_FILES.has(parts.at(-1) ?? "") && !SKIP_EXT.test(path);
  });
}

/** Reader count by repo size: 1-5 small, 6-10 medium, 11-20 large. */
export function readerCount(files: number): Pick<Scan, "size" | "readers"> {
  if (files < 300) return { size: "small", readers: Math.min(5, Math.max(1, Math.ceil(files / 60))) };
  if (files <= 2000) return { size: "medium", readers: Math.min(10, 6 + Math.floor((files - 300) / 425)) };
  return { size: "large", readers: Math.min(20, 11 + Math.floor((files - 2000) / 1000)) };
}

type Group = { path: string; files: string[] };

// Files of one group, regrouped one path segment deeper (files sitting
// directly in the folder stay together under the folder itself).
function split(group: Group): Group[] {
  const depth = group.path === "." ? 0 : group.path.split("/").length;
  const by = new Map<string, string[]>();
  for (const file of group.files) {
    const parts = file.split("/");
    const key = parts.length > depth + 1 ? parts.slice(0, depth + 1).join("/") : `${group.path}`;
    const list = by.get(key);
    if (list) list.push(file);
    else by.set(key, [file]);
  }
  return [...by].map(([path, files]) => ({ path, files }));
}

function slicesFor(files: string[], target: number): Slice[] {
  const top = new Map<string, string[]>();
  for (const file of files) {
    const first = file.includes("/") ? (file.split("/")[0] ?? ".") : ".";
    const list = top.get(first);
    if (list) list.push(file);
    else top.set(first, [file]);
  }
  let groups: Group[] = [...top].map(([path, list]) => ({ path, files: list }));
  const bySize = (a: Group, b: Group): number => b.files.length - a.files.length || a.path.localeCompare(b.path);
  while (groups.length < target) {
    groups.sort(bySize);
    // Split the largest group that has somewhere to go; leaf folders stay whole.
    const at = groups.findIndex((g) => split(g).length >= 2);
    const pick = groups[at];
    if (at < 0 || pick === undefined) break;
    groups = [...groups.slice(0, at), ...groups.slice(at + 1), ...split(pick)];
  }
  groups.sort(bySize);
  const slices: Slice[] = groups.map((g) => ({ paths: [g.path], files: g.files.length }));
  // Too many groups: fold the two smallest together until the target fits.
  while (slices.length > target) {
    const b = slices.pop();
    const a = slices.pop();
    if (a === undefined || b === undefined) break;
    slices.push({ paths: [...a.paths, ...b.paths], files: a.files + b.files });
    slices.sort((x, y) => y.files - x.files || (x.paths[0] ?? "").localeCompare(y.paths[0] ?? ""));
  }
  return slices;
}

/** Size the repo and cut it into one slice per reader (never more readers than slices). */
export function scanRepo(root: string): Scan {
  const files = listRepoFiles(root);
  const { size, readers } = readerCount(files.length);
  const slices = files.length === 0 ? [] : slicesFor(files, readers);
  return { files: files.length, size, readers: Math.min(readers, Math.max(slices.length, 1)), slices };
}

/** Fewest reader rows a reading log may list for a repo of this size. */
export function minReaders(size: Scan["size"], slices: number): number {
  const floor = size === "large" ? 11 : size === "medium" ? 6 : 1;
  return Math.min(floor, Math.max(slices, 1));
}
