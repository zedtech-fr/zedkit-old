import assert from "node:assert/strict";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  FEATURED_EXAMPLE,
  CSS_PATH,
  allBlocks,
  buildAdoptionPlan,
  loadRegistry,
  registryClosure,
  renderCss,
} from "../lib/adoption-plan.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const SITE = "https://zedkit.app";
const catalog = JSON.parse(readFileSync(join(ROOT, "docs/catalog/catalog.json"), "utf8"));
const registry = loadRegistry(ROOT);

function need(name) {
  for (const [packageName, entry] of Object.entries(catalog.packages)) {
    const found = entry.needs.find((item) => item.need === name);
    if (found) return { need: found, packageName };
  }
  throw new Error(`no need ${name}`);
}

function plan(name) {
  const { need: found, packageName } = need(name);
  return buildAdoptionPlan({ need: found, packageName, siteUrl: SITE }, { registry });
}

function mode(built, id) {
  const found = built.modes.find((item) => item.id === id);
  assert.ok(found, `mode ${id} exists`);
  return found;
}

const text = (m) => allBlocks(m).map((block) => (block.kind === "file" ? block.code : Object.values(block.commands).join("\n"))).join("\n");

test("Button: install package is install, load styles, import and render", () => {
  const built = plan("Trigger actions with buttons");
  const pkg = mode(built, "package");
  assert.deepEqual(pkg.steps.map((step) => step.id), ["install", "styles", "render"]);
  const [install, styles, render] = pkg.steps.map((step) => step.blocks);
  assert.deepEqual(install[0].commands, {
    pnpm: "pnpm add @zedtech/zedkit-ui",
    npm: "npm install @zedtech/zedkit-ui",
    yarn: "yarn add @zedtech/zedkit-ui",
  });
  assert.equal(styles[0].path, CSS_PATH);
  assert.equal(styles[0].lang, "css");
  assert.equal(
    styles[0].code,
    '@import "tailwindcss";\n@import "@zedtech/zedkit-ui/styles.css";\n@source "../../node_modules/@zedtech/zedkit-ui/src/**/*.{ts,tsx}";\n',
  );
  assert.equal(render[0].path, "src/app/page.tsx");
  assert.match(render[0].code, /^import \{ Button \} from "@zedtech\/zedkit-ui";/m);
  assert.match(render[0].code, /export default function Page\(\)/);
  assert.match(render[0].code, /<Button>Save<\/Button>/);
});

test("Theme: a stylesheet is a CSS import, never a JavaScript import", () => {
  const built = plan("Theme an admin app (dark/light included)");
  const pkg = mode(built, "package");
  const all = text(pkg);
  assert.doesNotMatch(all, /import \{[^}]*(styles\.css|@source)/, "no CSS path inside a named JS import");
  assert.doesNotMatch(all, /from "@zedtech\/zedkit-ui\/styles\.css"/);
  const install = pkg.steps[0].blocks[0].commands;
  assert.equal(install.pnpm, "pnpm add @zedtech/zedkit-ui next-themes");
  const css = pkg.steps.find((step) => step.id === "styles").blocks[0];
  assert.match(css.code, /^@import "tailwindcss";$/m);
  assert.match(css.code, /^@import "@zedtech\/zedkit-ui\/styles\.css";$/m);
  assert.match(css.code, /^@source ".*node_modules\/@zedtech\/zedkit-ui\/src\/.*";$/m);
  const example = pkg.steps.at(-1).blocks[0];
  assert.equal(example.path, "src/app/layout.tsx");
  assert.match(example.code, /ThemeProvider/);
  assert.doesNotMatch(example.code, /pnpm add/, "the install command is a step, not a comment");
});

test("Motion: utilities are class names, and the example is a complete component", () => {
  const built = plan("Animate entrances and hover feedback with CSS utilities");
  const pkg = mode(built, "package");
  const all = text(pkg);
  assert.doesNotMatch(all, /import \{[^}]*(animate-|data-reveal|stagger)/);
  const example = pkg.steps.at(-1).blocks[0];
  assert.match(example.code, /^import \{ Card \} from "@zedtech\/zedkit-ui";/m);
  assert.match(example.code, /className="animate-fade-up stagger-1"/);
  assert.doesNotMatch(example.code, /styles\.css/, "styles load through the CSS file, not a JS import");
});

test("a config preset is extended in a config file", () => {
  const built = plan("Share one strict TypeScript base");
  const pkg = mode(built, "package");
  assert.equal(pkg.steps[0].blocks[0].commands.pnpm, "pnpm add -D @zedtech/zedkit-quality");
  const file = pkg.steps.at(-1).blocks[0];
  assert.equal(file.path, "tsconfig.json");
  assert.equal(file.lang, "json");
  assert.deepEqual(JSON.parse(file.code), { extends: "@zedtech/zedkit-quality/tsconfig" });
});

test("a backend package installs and imports, with no styles step", () => {
  const built = plan("Fail fast on bad environment variables");
  const pkg = mode(built, "package");
  assert.deepEqual(pkg.steps.map((step) => step.id), ["install", "import"]);
  assert.equal(built.modes.length, 1, "no copy path without a registry brick");
});

test("Drawer manual copy lists every companion file, dependency and token", () => {
  const built = plan("Slide in a drawer panel");
  const manual = mode(built, "manual");
  const files = allBlocks(manual).filter((block) => block.kind === "file" && block.role);
  assert.deepEqual(
    files.map((file) => file.path),
    [
      "src/components/ui/drawer.tsx",
      "src/components/ui/drawer-non-modal.tsx",
      "src/components/ui/drawer-panel-classes.ts",
      "src/components/ui/drawer-non-modal-effects.ts",
      "src/components/ui/drawer-parts.tsx",
      "src/components/ui/drawer-non-modal-context.tsx",
      "src/components/ui/drawer-portal.tsx",
      "src/components/ui/drawer-vaul.tsx",
      "src/components/ui/drawer-meta.tsx",
      "src/components/ui/overlay-modal.ts",
      "src/components/ui/theme-scope.tsx",
      "src/components/ui/use-narrow-viewport.ts",
      "src/components/ui/ui-provider.tsx",
      "src/components/ui/create-messages-context.tsx",
      "src/components/ui/messages.ts",
      "src/components/ui/button.tsx",
      "src/components/ui/surface.tsx",
      "src/components/ui/parallax.tsx",
      "src/components/ui/parallax-types.ts",
    ],
  );
  assert.equal(files[0].role, "main");
  assert.ok(files.slice(1).every((file) => file.role === "companion"));
  const deps = manual.steps.find((step) => step.id === "dependencies").blocks[0].commands;
  for (const name of ["vaul", "lucide-react", "@radix-ui/react-slot", "class-variance-authority"]) {
    assert.ok(deps.pnpm.split(" ").includes(name), `${name} in "${deps.pnpm}"`);
  }
  const tokens = text({ steps: manual.steps.filter((step) => step.id === "tokens") });
  assert.match(tokens, /--overlay:/, "drawer's own colour token");
  assert.match(tokens, /@utility focus-ring-control/, "button's utility");
  assert.match(tokens, /--spacing-control-height:/, "button's theme token");
  const render = manual.steps.at(-1).blocks[0];
  assert.match(render.code, /import \{ Button \} from "@\/components\/ui\/button";/);
  assert.match(render.code, /import \{[^}]*\bDrawer\b[^}]*\} from "@\/components\/ui\/drawer";/);
  assert.doesNotMatch(render.code, /@zedtech\/zedkit-ui/);
});

test("Drawer CLI registers the namespace its sibling needs; Button does not", () => {
  const drawer = mode(plan("Slide in a drawer panel"), "cli");
  assert.ok(drawer.steps.some((step) => step.id === "namespace"), "drawer depends on @zedkit/button");
  const namespace = drawer.steps.find((step) => step.id === "namespace").blocks[0].commands;
  assert.equal(namespace.pnpm, "pnpm dlx shadcn@latest registry add @zedkit=https://zedkit.app/r/{name}.json");
  const add = drawer.steps.find((step) => step.id === "add").blocks[0].commands;
  assert.equal(add.npm, "npx shadcn@latest add https://zedkit.app/r/drawer.json");
  const button = mode(plan("Trigger actions with buttons"), "cli");
  assert.ok(!button.steps.some((step) => step.id === "namespace"));
});

test("every copy mode starts from a shadcn project and says what it requires", () => {
  for (const id of ["cli", "manual"]) {
    const m = mode(plan("Trigger actions with buttons"), id);
    assert.equal(m.steps[0].id, "init");
    assert.equal(m.steps[0].blocks[0].commands.pnpm, "pnpm dlx shadcn@latest init -d");
    assert.ok(m.requires.length > 0 && m.gives.length > 0);
  }
});

test("the registry graph is closed: every local import of a brick resolves inside its closure", () => {
  const missing = [];
  for (const item of registry.items) {
    const { files } = registryClosure(registry, item.name);
    const have = new Set(files.map((file) => file.name));
    for (const file of files) {
      for (const match of file.content.matchAll(/from\s+["']@\/components\/ui\/([^"']+)["']/g)) {
        if (!have.has(match[1])) missing.push(`${item.name}: ${file.name} imports ${match[1]}`);
      }
      for (const match of file.content.matchAll(/from\s+["'](\.{1,2}\/[^"']+)["']/g)) {
        missing.push(`${item.name}: ${file.name} has a relative import ${match[1]}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("every package a brick imports is declared by its closure", () => {
  const undeclared = [];
  for (const item of registry.items) {
    const { files, dependencies } = registryClosure(registry, item.name);
    for (const file of files) {
      for (const match of file.content.matchAll(/from\s+["']([^"'.@][^"']*|@[^"'/]+\/[^"']+)["']/g)) {
        const spec = match[1];
        if (spec.startsWith("@/")) continue;
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        if (["react", "react-dom"].includes(pkg)) continue;
        if (!dependencies.includes(pkg)) undeclared.push(`${item.name}: ${file.name} imports ${pkg}`);
      }
    }
  }
  assert.deepEqual(undeclared, []);
});

test("registry CSS renders as the three kinds of block CSS has", () => {
  const css = renderCss({
    cssVars: {
      light: { overlay: "0 0% 0%" },
      dark: { overlay: "0 0% 0%" },
      theme: { "motion-fast": "150ms" },
    },
    css: {
      "@keyframes zk-fade-in": { from: { opacity: "0" } },
      "@utility button-press": { "transition-duration": "var(--motion-base)", "&:active:not(:disabled)": { scale: "var(--zk-press-scale)" } },
      "@media (prefers-reduced-motion: reduce)": { "html [data-x]": { animation: "none !important" } },
    },
  });
  assert.match(css, /:root \{\n {2}--overlay: 0 0% 0%;\n\}/);
  assert.match(css, /\.dark \{\n {2}--overlay: 0 0% 0%;\n\}/);
  assert.match(css, /@theme inline \{\n {2}--motion-fast: 150ms;\n\}/);
  assert.match(css, /@keyframes zk-fade-in \{\n {2}from \{\n {4}opacity: 0;\n {2}\}\n\}/);
  assert.match(css, /@utility button-press \{\n {2}transition-duration: var\(--motion-base\);\n {2}&:active:not\(:disabled\) \{\n {4}scale: var\(--zk-press-scale\);\n {2}\}\n\}/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\) \{\n {2}html \[data-x\] \{\n {4}animation: none !important;\n {2}\}\n\}/);
});

test("every UI page with a copy path can show a working example, or says plainly it cannot", () => {
  const problems = [];
  for (const [packageName, entry] of Object.entries(catalog.packages)) {
    for (const found of entry.needs) {
      if (!found.registry) continue;
      const built = buildAdoptionPlan({ need: found, packageName, siteUrl: SITE }, { registry });
      for (const id of ["cli", "manual"]) {
        const m = built.modes.find((item) => item.id === id);
        if (!m) {
          problems.push(`${found.need}: no ${id} mode`);
          continue;
        }
        const render = m.steps.at(-1);
        if (render.id !== "render") problems.push(`${found.need}: ${id} ends with ${render.id}`);
      }
    }
  }
  assert.deepEqual(problems, []);
});

test("the home page's plan agrees with the tested quickstart snippets, so the two cannot drift", () => {
  const snippet = (name) => readFileSync(join(ROOT, "apps/docs/home-quickstart/snippets", name), "utf8").trim();
  const { need: found, packageName } = need("Trigger actions with buttons");
  const built = buildAdoptionPlan({ need: found, packageName, siteUrl: SITE, example: FEATURED_EXAMPLE }, { registry });
  assert.equal(mode(built, "package").steps[0].blocks[0].commands.pnpm, snippet("install.sh"));
  const cli = mode(built, "cli");
  const commandOf = (id) => cli.steps.find((step) => step.id === id).blocks[0].commands.npm;
  assert.equal(commandOf("theme"), snippet("registry-theme-add.sh"));
  assert.equal(commandOf("add"), snippet("registry-add.sh"));
  const example = mode(built, "package").steps.at(-1).blocks[0];
  assert.match(example.code, /<Button>Save<\/Button>/);
});

test("a file two bricks share is listed once: the manual copy never repeats a path", () => {
  const closure = registryClosure(registry, "confirm-dialog");
  const paths = closure.files.map((file) => file.path);
  assert.equal(new Set(paths).size, paths.length, `duplicates in ${paths.join(", ")}`);
  for (const brick of registry.byName.keys()) {
    const files = registryClosure(registry, brick).files.map((file) => file.path);
    assert.equal(new Set(files).size, files.length, `${brick} lists a path twice`);
  }
});

test("a config file is merged into, never replaced: it holds the reader's own settings", () => {
  const file = mode(plan("Share one strict TypeScript base"), "package").steps.at(-1).blocks[0];
  assert.equal(file.action, "merge");
});

test("SecretField package example is a complete page that typechecks", () => {
  const built = plan("Display a shown-once secret with copy");
  const pkg = mode(built, "package");
  const page = allBlocks(pkg).find((block) => block.kind === "file" && block.path.endsWith("page.tsx"));
  assert.ok(page, "package mode writes a page");
  assert.match(page.code, /export default function Page/);
  assert.doesNotMatch(page.code, /value=\{key\}/);
  assert.match(page.code, /value="zk_live_example_secret"/);

  const dir = join(dirname(fileURLToPath(import.meta.url)), "../.tmp-complete-examples");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "secret-field-page.tsx"), page.code);
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        files: ["./secret-field-page.tsx"],
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          incremental: false,
        },
      },
      null,
      2,
    )}\n`,
  );
  const result = spawnSync(join(ROOT, "node_modules/.bin/tsc"), ["-p", join(dir, "tsconfig.json"), "--pretty", "false"], {
    encoding: "utf8",
  });
  rmSync(dir, { recursive: true, force: true });
  assert.equal(result.status, 0, result.stdout + result.stderr);
});

function packagePageExports() {
  // Every package-mode render block that is a full page: the exact bytes the
  // public Copy button puts on the clipboard (FileBlock copies block.code).
  const pages = [];
  for (const [packageName, entry] of Object.entries(catalog.packages)) {
    for (const found of entry.needs) {
      const built = buildAdoptionPlan({ need: found, packageName, siteUrl: SITE }, { registry });
      const pkg = built.modes.find((item) => item.id === "package");
      const page = allBlocks(pkg).find(
        (block) => block.kind === "file" && block.path === "src/app/page.tsx" && block.code.includes("export default function Page"),
      );
      if (page) pages.push({ need: found.need, packageName, code: page.code });
    }
  }
  return pages;
}

function tscRun(dir, files) {
  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        files,
        compilerOptions: {
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "bundler",
          jsx: "react-jsx",
          noEmit: true,
          strict: true,
          skipLibCheck: true,
          incremental: false,
        },
      },
      null,
      2,
    )}\n`,
  );
  const result = spawnSync(join(ROOT, "node_modules/.bin/tsc"), ["-p", join(dir, "tsconfig.json"), "--pretty", "false"], {
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

function filesWithErrors(output) {
  // Filenames only: tsc prints paths relative to the caller's cwd.
  return [...new Set([...output.matchAll(/([\w-]+\.tsx)\(\d+,\d+\): error TS\d+/g)].map((match) => match[1]))];
}

test("every copyable page export typechecks (exact copy bytes)", () => {
  const pages = packagePageExports();
  // Floor, not an exact pin: the audit counted 48 public payloads; the tree
  // may ship more, but must never silently ship fewer.
  assert.ok(pages.length >= 48, `expected at least the 48 audited page exports, found ${pages.length}`);
  const dir = join(dirname(fileURLToPath(import.meta.url)), "../.tmp-complete-examples");
  mkdirSync(dir, { recursive: true });
  const names = pages.map((page, index) => `page-${String(index + 1).padStart(2, "0")}.tsx`);
  names.forEach((name, index) =>
    writeFileSync(join(dir, name), `// need: ${pages[index].need} [${pages[index].packageName}]\n${pages[index].code}`),
  );
  // Green path: one tsc run; exit 0 means zero errors of any kind. A red run
  // re-runs once without the failing files: one syntax-broken page masks the
  // semantic errors of the whole program, while syntax errors never mask each
  // other, so two rounds attribute every failure.
  const first = tscRun(dir, names.map((name) => `./${name}`));
  const rounds = [first.output];
  let bad = first.status === 0 ? [] : filesWithErrors(first.output);
  if (first.status !== 0 && bad.length === 0) {
    rmSync(dir, { recursive: true, force: true });
    assert.fail(`tsc failed without file errors (status ${first.status}):\n${first.output}`);
  }
  if (bad.length > 0) {
    const remaining = names.filter((name) => !bad.includes(name));
    if (remaining.length > 0) {
      const second = tscRun(dir, remaining.map((name) => `./${name}`));
      rounds.push(second.output);
      bad = [...bad, ...filesWithErrors(second.output).filter((name) => !bad.includes(name))];
    }
  }
  rmSync(dir, { recursive: true, force: true });
  const needOf = new Map(names.map((name, index) => [name, pages[index].need]));
  assert.deepEqual(
    bad.map((name) => needOf.get(name) ?? name).sort(),
    [],
    `${bad.length} of ${names.length} page exports do not typecheck:\n${rounds.join("\n")}`,
  );
});
