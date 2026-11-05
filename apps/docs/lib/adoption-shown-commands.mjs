/**
 * Install commands shown on the home panel and the getting-started guide.
 * adoption-smoke must execute each one (criterion 3b).
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const INSTALL_LINE = /^(pnpm add|npm install|yarn add|npx shadcn|pnpm dlx shadcn|yarn dlx shadcn)\b/;

/** Collapse package-manager and shadcn-version differences so `npx shadcn@latest add X` matches `pnpm dlx shadcn@4 add X`. */
export function installCommandKey(command) {
  return command
    .trim()
    .replace(/shadcn@\S+/g, "shadcn")
    .replace(/^(?:pnpm dlx|yarn dlx|npx)\s+/, "")
    .replace(/^(?:pnpm add -D|npm install -D|yarn add -D)\s+/, "add-dev ")
    .replace(/^(?:pnpm add|npm install|yarn add)\s+/, "add ")
    .replace(/ --yes --overwrite$/, "")
    .replace(/ -y -o$/, "");
}

function snippetLines(root, id) {
  const path = join(root, "apps/docs/prose/guides/snippets", id);
  if (!id.endsWith(".sh") || !existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => INSTALL_LINE.test(line) && !line.includes("<"));
}

/** Commands a visitor is told to paste on getting-started. Home panel commands come from the adoption plan. */
export function shownInstallCommands(root = DEFAULT_ROOT) {
  const page = readFileSync(join(root, "apps/docs/prose/guides/getting-started.mdx"), "utf8");
  const ids = [...page.matchAll(/\{\{snippet:([^}]+)\}\}/g)].map((match) => match[1]);
  return [...new Set(ids.flatMap((id) => snippetLines(root, id)))];
}

/** pnpm/npm/yarn command blocks a smoke case will run. */
export function commandsFromPlan(plan, modeId) {
  const mode = plan.modes.find((item) => item.id === modeId);
  if (!mode) return [];
  return mode.steps.flatMap((step) =>
    step.blocks.filter((block) => block.kind === "command").flatMap((block) => Object.values(block.commands)),
  );
}

export function uncoveredInstallCommands(shown, executed) {
  const have = new Set(executed.map(installCommandKey));
  return shown.filter((command) => !have.has(installCommandKey(command)));
}

export function isWorkspacePackageAdd(command) {
  return /^(?:pnpm add(?: -D)?|npm install(?: -D)?|yarn add(?: -D)?) @zedtech\/zedkit-/.test(command);
}

export function packagesNamedInAdd(command) {
  return command.split(/\s+/).filter((token) => token.startsWith("@zedtech/zedkit-"));
}

/** Map `@zedtech/zedkit-core` → `packages/core` by reading each workspace package.json. */
export function workspacePackageDir(packageName, root = DEFAULT_ROOT) {
  const packages = join(root, "packages");
  for (const name of readdirSync(packages)) {
    const dir = join(packages, name);
    const pkgPath = join(dir, "package.json");
    if (!existsSync(pkgPath)) continue;
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    if (pkg.name === packageName) return dir;
  }
  return null;
}
