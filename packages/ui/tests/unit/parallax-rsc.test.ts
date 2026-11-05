import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const src = join(pkg, "src");
const repo = resolve(pkg, "..", "..");
const require = createRequire(import.meta.url);

const CLIENT_RE = /^["']use client["']/m;
const IMPORT_RE = /from\s+["'](\.[^"']+)["']/g;

function collectGraph(file: string, seen = new Set<string>()): string[] {
  const abs = resolve(file);
  if (seen.has(abs)) return [...seen];
  seen.add(abs);
  const text = readFileSync(abs, "utf8");
  const dir = dirname(abs);
  for (const match of text.matchAll(IMPORT_RE)) {
    const spec = match[1]!;
    const candidates = [spec, spec.replace(/\.js$/, ".ts"), spec.replace(/\.js$/, ".tsx")].map((entry) =>
      resolve(dir, entry),
    );
    const hit = candidates.find((path) => existsSync(path));
    if (hit) collectGraph(hit, seen);
  }
  return [...seen];
}

describe("motion subpath RSC graph", () => {
  it("has no use client in the server entry graph", () => {
    const files = collectGraph(join(src, "motion/index.ts"));
    expect(files.length).toBeGreaterThan(3);
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text, relative(src, file)).not.toMatch(CLIENT_RE);
    }
  });

  it("keeps the vanilla runtime free of React", () => {
    const files = collectGraph(join(src, "motion/runtime.ts"));
    for (const file of files) {
      const text = readFileSync(file, "utf8");
      expect(text).not.toMatch(CLIENT_RE);
      expect(text).not.toMatch(/from ["']react["']/);
    }
  });
});

describe("Next build of @zedtech/zedkit-ui/motion", () => {
  it("compiles a Server Component page that imports the subpath", () => {
    const nextBin = require.resolve("next/dist/bin/next", { paths: [join(repo, "apps/docs")] });
    const dir = mkdtempSync(join(tmpdir(), "zk-motion-rsc-"));
    const app = join(dir, "app");
    mkdirSync(app, { recursive: true });
    writeFileSync(
      join(dir, "package.json"),
      `${JSON.stringify({ name: "motion-rsc-probe", private: true, type: "module" })}\n`,
    );
    writeFileSync(
      join(dir, "next.config.mjs"),
      `const ui = ${JSON.stringify(src)};
const uiModules = ${JSON.stringify(join(pkg, "node_modules"))};
export default {
  output: "export",
  images: { unoptimized: true },
  webpack(config) {
    config.resolve.extensionAlias = { ".js": [".tsx", ".ts", ".js"] };
    config.resolve.modules = [uiModules, ...(config.resolve.modules ?? ["node_modules"])];
    config.resolve.alias["@zedtech/zedkit-ui/motion"] = ui + "/motion/index.ts";
    return config;
  },
};
`,
    );
    writeFileSync(join(app, "layout.jsx"), `export default function Layout({ children }) { return <html><body>{children}</body></html>; }\n`);
    writeFileSync(
      join(app, "page.jsx"),
      `import { ParallaxLayer, ParallaxSection } from "@zedtech/zedkit-ui/motion";
export default function Page() {
  return (
    <ParallaxSection range="page">
      <ParallaxLayer depth="far" />
      <h1>Title</h1>
    </ParallaxSection>
  );
}
`,
    );
    const result = spawnSync(process.execPath, [nextBin, "build", "--webpack"], {
      cwd: dir,
      encoding: "utf8",
      env: {
        ...process.env,
        NODE_ENV: "production",
        NODE_PATH: [join(pkg, "node_modules"), join(repo, "apps/docs/node_modules"), join(repo, "node_modules")].join(
          ":",
        ),
      },
    });
    const output = `${result.stderr}\n${result.stdout}`;
    const status = result.status;
    rmSync(dir, { recursive: true, force: true });
    expect(status, output).toBe(0);
  }, 120_000);
});
