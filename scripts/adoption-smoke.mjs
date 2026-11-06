#!/usr/bin/env node
// Follows the adoption instructions people are shown, and nothing else, in a clean Next.js project.
//
// The steps come from `buildAdoptionPlan` (apps/docs/lib/adoption-plan.mjs), the function the home page and
// every component page render from. Each command runs as displayed and each file is written where the step
// says. The only differences from a person at a terminal are listed here and printed in the log:
//   - the kit package resolves to the tarball built from this checkout (a pnpm override), so a pull request is
//     checked against its own code; set ADOPTION_PACKAGE=published to use what npm serves;
//   - https://zedkit.app/r/ resolves to the registry JSON built from this checkout (apps/docs/public/r);
//   - shadcn@latest is pinned (SHADCN_VERSION), and `add` answers its prompts (--yes --overwrite).
//
// Usage: node scripts/adoption-smoke.mjs [case ...]   (default: every case)
//   cases: home-button-package, home-button-cli, home-button-manual, drawer-cli, drawer-manual,
//          theme-package, motion-package, drawer-manual-incomplete, getting-started-packages
//   `drawer-manual-incomplete` is the negative control: it replays the Drawer recipe as it was before the
//   registry graph fed it (one file, no companions, no packages) and passes only if the build fails.
//   ADOPTION_SMOKE_JOBS (default 3) caps how many cases run at once.
// Needs network (create-next-app, npm) and Chromium (pnpm exec playwright install chromium).
/* global document, getComputedStyle -- page.evaluate callbacks run in the browser. */
import { execFileSync, spawn } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, appendFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://zedkit.app";
const SITE_REGISTRY = `${SITE}/r/`;
const REGISTRY_DIR = join(ROOT, "apps/docs/public/r");

/** Registry URL on https://zedkit.app/r/ — origin + path, not a substring. */
export function isSiteRegistryToken(token) {
  const start = token.indexOf("https://");
  if (start < 0) return false;
  const urlText = token.slice(start);
  if (!URL.canParse(urlText)) return false;
  const url = new URL(urlText);
  return url.origin === SITE && url.pathname.startsWith("/r/");
}
/** npm version / dist-tag charset: no spaces or shell metacharacters. */
export function pinVersion(raw, label) {
  if (!/^[0-9A-Za-z._-]+$/.test(raw)) {
    throw new Error(`${label} must be a version or dist-tag, got ${JSON.stringify(raw)}`);
  }
  return raw;
}
const SHADCN = pinVersion(process.env.SHADCN_VERSION ?? "4.22.1", "SHADCN_VERSION");
const NEXT_APP = pinVersion(process.env.CREATE_NEXT_APP_VERSION ?? "16.4.3", "CREATE_NEXT_APP_VERSION");
const PACKAGE_SOURCE = process.env.ADOPTION_PACKAGE ?? "local";

const { buildAdoptionPlan, loadRegistry, FEATURED_EXAMPLE } = await import(join(ROOT, "apps/docs/lib/adoption-plan.mjs"));
const {
  commandsFromPlan,
  isWorkspacePackageAdd,
  packagesNamedInAdd,
  shownInstallCommands,
  uncoveredInstallCommands,
  workspacePackageDir,
} = await import(join(ROOT, "apps/docs/lib/adoption-shown-commands.mjs"));
const catalog = JSON.parse(readFileSync(join(ROOT, "docs/catalog/catalog.json"), "utf8"));
const registry = loadRegistry(ROOT);

function findNeed(name) {
  for (const [packageName, entry] of Object.entries(catalog.packages)) {
    const need = entry.needs.find((item) => item.need === name);
    if (need) return { need, packageName };
  }
  throw new Error(`catalog has no need "${name}"`);
}

function plan(name, example) {
  const { need, packageName } = findNeed(name);
  return buildAdoptionPlan({ need, packageName, siteUrl: SITE, ...(example ? { example } : {}) }, { registry });
}

/** Page checks run in Chromium against the built app. */
const buttonChecks = async ({ page }) => {
  const button = page.getByRole("button", { name: "Save" });
  await button.waitFor();
  const style = await button.evaluate((el) => {
    const css = getComputedStyle(el);
    return { background: css.backgroundColor, height: el.getBoundingClientRect().height, radius: css.borderTopLeftRadius };
  });
  assert(style.background !== "rgb(239, 239, 239)" && style.background !== "rgba(0, 0, 0, 0)", `Button is unstyled (${style.background})`);
  assert(style.height >= 32, `Button is ${style.height}px tall`);
};

/** The old, incomplete Drawer recipe: the main file alone. A check that cannot fail proves nothing. */
function incompleteDrawer() {
  const built = plan("Slide in a drawer panel");
  const manual = built.modes.find((mode) => mode.id === "manual");
  const steps = manual.steps
    .filter((step) => ["init", "files", "render"].includes(step.id))
    .map((step) => (step.id === "files" ? { ...step, blocks: step.blocks.filter((block) => block.role === "main") } : step));
  return { ...built, modes: [{ ...manual, steps }] };
}

export const CASES = {
  "home-button-package": { mode: "package", plan: () => plan("Trigger actions with buttons", FEATURED_EXAMPLE), check: buttonChecks },
  "home-button-cli": { mode: "cli", plan: () => plan("Trigger actions with buttons", FEATURED_EXAMPLE), check: buttonChecks },
  "home-button-manual": { mode: "manual", plan: () => plan("Trigger actions with buttons", FEATURED_EXAMPLE), check: buttonChecks },
  "drawer-cli": { mode: "cli", plan: () => plan("Slide in a drawer panel"), check: drawerChecks },
  "drawer-manual": { mode: "manual", plan: () => plan("Slide in a drawer panel"), check: drawerChecks },
  "drawer-manual-incomplete": { mode: "manual", expectFailure: true, plan: incompleteDrawer, check: drawerChecks },
  "theme-package": {
    mode: "package",
    plan: () => plan("Theme an admin app (dark/light included)"),
    check: async ({ page, context, url }) => {
      const read = () => page.evaluate(() => ({ background: getComputedStyle(document.documentElement).getPropertyValue("--background").trim(), cls: document.documentElement.className }));
      const light = await read();
      assert(light.background !== "", "the kit tokens did not load: --background is empty");
      await page.emulateMedia({ colorScheme: "dark" });
      await page.goto(url);
      await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
      const dark = await read();
      assert(dark.background !== light.background, `dark mode did not change --background (${dark.background})`);
      void context;
    },
  },
  "motion-package": {
    mode: "package",
    plan: () => plan("Animate entrances and hover feedback with CSS utilities"),
    check: async ({ page }) => {
      const card = page.getByText("First", { exact: true });
      await card.waitFor();
      const animation = await card.evaluate((el) => getComputedStyle(el).animationName);
      assert(animation !== "none" && animation !== "", `animate-fade-up produced no animation (${animation})`);
    },
  },
  /** Getting-started `pnpm add` lines that the Next.js cases do not already run. */
  "getting-started-packages": { kind: "shown-package-adds" },
};

async function drawerChecks({ page }) {
  await page.getByRole("button", { name: "Open" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.waitFor();
  assert((await dialog.innerText()).includes("Details"), "the drawer opened without its title");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function spawnInherit(file, args, cwd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd,
      stdio: "inherit",
      env: { ...process.env, CI: "1", NEXT_TELEMETRY_DISABLED: "1", ...env },
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (code === 0) resolve();
      else reject(new Error(`${[file, ...args].join(" ")} exited ${code ?? signal}`));
    });
  });
}

/** A fixed program with arguments: nothing is parsed by a shell, so a path with a space or a quote stays one argument. */
function run(file, args, cwd, env = {}) {
  console.log(`\n$ ${[file, ...args].join(" ")}`);
  return spawnInherit(file, args, cwd, env);
}

/** The packed `.tgz` in `dir`, as a path. No shell glob, so `dir` may contain spaces or metacharacters. */
export function packedTarball(dir) {
  const names = readdirSync(dir).filter((name) => name.endsWith(".tgz"));
  assert(names.length === 1, `expected one tarball in ${dir}, got ${names.join(", ") || "none"}`);
  return join(dir, names[0]);
}

/**
 * Displayed command as argv. The local registry path is one argument, not spliced into a shell line.
 * `shadcn@latest` is pinned; `shadcn … add` gets the same `--yes --overwrite` the page cannot type.
 */
export function localizeCommand(commandText, { registryDir, shadcnVersion } = {}) {
  const dir = registryDir ?? REGISTRY_DIR;
  const pinned = pinVersion(shadcnVersion ?? SHADCN, "SHADCN_VERSION");
  const trimmed = commandText.trim();
  // Whitespace split is not a shell: pipes, quotes and substitution would be silently
  // passed as arguments. Current shown commands have none of these.
  if (/[|&;<>()`'"\\*?\n]/.test(trimmed) || trimmed.includes("$")) {
    throw new Error(`shown command uses shell syntax that argv cannot run: ${JSON.stringify(commandText)}`);
  }
  const tokens = trimmed.split(/\s+/).filter(Boolean).map((token) => {
    if (isSiteRegistryToken(token)) return token.replaceAll(SITE_REGISTRY, `${dir}/`);
    if (token.startsWith("shadcn@latest")) return `shadcn@${pinned}${token.slice("shadcn@latest".length)}`;
    return token;
  });
  const shadcnAt = tokens.findIndex((token) => /^shadcn@\S+$/.test(token));
  if (shadcnAt >= 0 && tokens[shadcnAt + 1] === "add") tokens.push("--yes", "--overwrite");
  return tokens;
}

/** Run a displayed command as argv so a checkout path cannot inject a shell command. */
export function runLocalized(commandText, cwd, env = {}, opts = {}) {
  const argv = localizeCommand(commandText, opts);
  return run(argv[0], argv.slice(1), cwd, env);
}

/** The project's own pnpm decides: a packageManager field can switch the version inside it. */
function pnpmMajor(project) {
  return Number(execFileSync("pnpm", ["--version"], { cwd: project, encoding: "utf8" }).trim().split(".")[0]);
}

function overridePackage(project, tarball) {
  overridePackages(project, { "@zedtech/zedkit-ui": tarball });
}

function overridePackages(project, tarballs) {
  const overrides = Object.fromEntries(Object.entries(tarballs).map(([name, file]) => [name, `file:${file}`]));
  if (pnpmMajor(project) >= 10) {
    const lines = Object.entries(overrides).map(([name, spec]) => `  "${name}": "${spec}"`);
    appendFileSync(join(project, "pnpm-workspace.yaml"), `overrides:\n${lines.join("\n")}\n`);
    return;
  }
  const pkgPath = join(project, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
  pkg.pnpm = { ...(pkg.pnpm ?? {}), overrides: { ...(pkg.pnpm?.overrides ?? {}), ...overrides } };
  writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
}

function applyFile(project, block) {
  const target = join(project, block.path);
  mkdirSync(dirname(target), { recursive: true });
  if (block.action === "append") appendFileSync(target, `\n${block.code}`);
  else writeFileSync(target, block.code);
  console.log(`\n# ${block.action} ${block.path} (${block.code.split("\n").length} lines)`);
}

async function runMode(project, mode) {
  for (const step of mode.steps) {
    console.log(`\n== ${step.id}: ${step.title}`);
    for (const block of step.blocks) {
      if (block.kind === "command") await runLocalized(block.commands.pnpm, project);
      else if (block.kind === "file") applyFile(project, block);
      else throw new Error(`step ${step.id} has a ${block.kind} block, which has no place to be run`);
    }
  }
}

async function serve(project) {
  const port = 3400 + Math.floor(Math.random() * 400);
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(port)], { cwd: project, stdio: "inherit" });
  const url = `http://127.0.0.1:${port}/`;
  for (let i = 0; i < 60; i += 1) {
    const ready = await fetch(url).then((res) => res.ok, () => false);
    if (ready) return { url, stop: () => child.kill() };
    await new Promise((done) => setTimeout(done, 1000));
  }
  child.kill();
  throw new Error("next start did not answer");
}

async function runShownPackageAdds() {
  const executed = Object.values(CASES)
    .filter((spec) => spec.plan && spec.mode)
    .flatMap((spec) => commandsFromPlan(spec.plan(), spec.mode));
  const uncovered = uncoveredInstallCommands(shownInstallCommands(ROOT), executed);
  const adds = uncovered.filter(isWorkspacePackageAdd);
  const other = uncovered.filter((command) => !isWorkspacePackageAdd(command));
  assert(other.length === 0, `shown install command is not a smoke case: ${other.join("; ")}`);
  if (adds.length === 0) {
    console.log("\nadoption-smoke: getting-started-packages ok (already covered)");
    return;
  }
  const work = mkdtempSync(join(tmpdir(), "zedkit-adoption-shown-"));
  const project = join(work, "app");
  mkdirSync(project);
  writeFileSync(join(project, "package.json"), `${JSON.stringify({ name: "shown-installs", private: true }, null, 2)}\n`);
  if (PACKAGE_SOURCE === "local") {
    const names = [...new Set(adds.flatMap(packagesNamedInAdd))];
    await run("pnpm", ["exec", "turbo", "run", "build", ...names.map((name) => `--filter=${name}`)], ROOT);
    const tarballs = {};
    for (const name of names) {
      const dest = join(work, "pack", name.replace("@zedtech/", ""));
      mkdirSync(dest, { recursive: true });
      const dir = workspacePackageDir(name, ROOT);
      assert(dir, `no packages/* folder for ${name}`);
      await run("pnpm", ["pack", "--pack-destination", dest], dir);
      tarballs[name] = packedTarball(dest);
    }
    overridePackages(project, tarballs);
  }
  await run("pnpm", ["install"], project);
  for (const command of adds) {
    await runLocalized(command, project);
    for (const name of packagesNamedInAdd(command)) {
      const installed = JSON.parse(readFileSync(join(project, "node_modules", name, "package.json"), "utf8"));
      assert(installed.name === name, `${command} did not install ${name}`);
      if (PACKAGE_SOURCE === "local") {
        const local = JSON.parse(readFileSync(join(workspacePackageDir(name, ROOT), "package.json"), "utf8")).version;
        assert(installed.version === local, `${name} resolved to ${installed.version}, not this checkout's ${local}`);
      }
    }
  }
  if (!process.env.ADOPTION_KEEP) rmSync(work, { recursive: true, force: true });
  else console.log(`kept ${work}`);
}

async function runCase(name, template, tarball, chromium) {
  console.log(`\n======== ${name} ========`);
  const spec = CASES[name];
  if (spec.kind === "shown-package-adds") {
    await runShownPackageAdds();
    console.log(`\nadoption-smoke: ${name} ok`);
    return;
  }
  if (spec.expectFailure) {
    const error = await runCaseOnce(name, spec, template, tarball, chromium).then(() => null, (thrown) => thrown);
    assert(error, `${name} was expected to fail and did not`);
    // It must fail where the old recipe did, in the build. A network flake while scaffolding or installing is not the proof.
    assert(/next build/.test(String(error.message)), `${name} failed, but not in the build step: ${String(error.message).slice(0, 200)}`);
    console.log(`\nadoption-smoke: ${name} failed as expected`);
    return;
  }
  await runCaseOnce(name, spec, template, tarball, chromium);
  console.log(`\nadoption-smoke: ${name} ok`);
}

function runCaseOnce(name, spec, template, tarball, chromium) {
  const project = mkdtempSync(join(tmpdir(), `zedkit-adoption-${name}-`));
  return buildAndCheck(name, spec, project, template, tarball, chromium).finally(() => {
    if (!process.env.ADOPTION_KEEP) rmSync(project, { recursive: true, force: true });
    else console.log(`kept ${project}`);
  });
}

async function buildAndCheck(name, spec, project, template, tarball, chromium) {
  cpSync(template, project, { recursive: true });
  if (tarball) overridePackage(project, tarball);
  await run("pnpm", ["install"], project);
  const built = spec.plan();
  const mode = built.modes.find((item) => item.id === spec.mode);
  if (!mode) throw new Error(`${name}: the plan has no ${spec.mode} mode`);
  await runMode(project, mode);
  if (tarball && mode.id === "package") {
    const installed = JSON.parse(readFileSync(join(project, "node_modules/@zedtech/zedkit-ui/package.json"), "utf8")).version;
    const local = JSON.parse(readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")).version;
    assert(installed === local, `the kit resolved to ${installed}, not this checkout's ${local}`);
  }
  await run("pnpm", ["exec", "next", "build"], project);
  const server = await serve(project);
  const browser = await chromium.launch();
  const inBrowser = async () => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const problems = [];
    page.on("pageerror", (error) => problems.push(error.message));
    page.on("console", (message) => message.type() === "error" && problems.push(message.text()));
    await page.goto(server.url);
    await spec.check({ page, context, url: server.url });
    assert(problems.length === 0, `console errors: ${problems.join(" | ")}`);
  };
  await inBrowser().finally(async () => {
    await browser.close();
    server.stop();
  });
}

async function main() {
  const wanted = process.argv.slice(2);
  const names = wanted.length > 0 ? wanted : Object.keys(CASES);
  for (const name of names) assert(CASES[name], `unknown case ${name} (${Object.keys(CASES).join(", ")})`);

  const appCases = names.filter((name) => CASES[name].kind !== "shown-package-adds");
  if (appCases.length > 0) {
    assert(existsSync(join(REGISTRY_DIR, "button.json")), `missing ${REGISTRY_DIR}/button.json (run pnpm registry:build)`);
  }

  const work = mkdtempSync(join(tmpdir(), "zedkit-adoption-base-"));
  const template = join(work, "app");
  let tarball = null;
  let chromium = null;
  if (appCases.length > 0) {
    if (PACKAGE_SOURCE === "local") {
      await run("pnpm", ["exec", "turbo", "run", "build", "--filter=@zedtech/zedkit-ui"], ROOT);
      await run("pnpm", ["pack", "--pack-destination", work], join(ROOT, "packages/ui"));
      tarball = packedTarball(work);
    }
    await run("pnpm", ["dlx", `create-next-app@${NEXT_APP}`, "app", "--ts", "--tailwind", "--eslint", "--app", "--src-dir", "--import-alias", "@/*", "--use-pnpm", "--skip-install", "--yes"], work);
    ({ chromium } = await import("@playwright/test"));
  }

  const failures = [];
  await eachPool(names, smokeJobs(), async (name) => {
    await runCase(name, template, tarball, chromium).catch((error) => {
      failures.push(`${name}: ${error.message}`);
      console.error(`\nadoption-smoke: ${name} FAILED: ${error.message}`);
    });
  });
  rmSync(work, { recursive: true, force: true });
  if (failures.length > 0) {
    console.error(`\nadoption-smoke: ${failures.length} failed\n${failures.join("\n")}`);
    process.exit(1);
  }
  console.log(`\nadoption-smoke: ok (${names.join(", ")})`);
}

function smokeJobs() {
  const raw = process.env.ADOPTION_SMOKE_JOBS ?? "3";
  const n = Number(raw);
  assert(Number.isInteger(n) && n >= 1, `ADOPTION_SMOKE_JOBS must be a positive integer, got ${raw}`);
  return n;
}

async function eachPool(items, limit, fn) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next;
      next += 1;
      if (i >= items.length) return;
      await fn(items[i]);
    }
  }));
}

const isMain = process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) await main();
