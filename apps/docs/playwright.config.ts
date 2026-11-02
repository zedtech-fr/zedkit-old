import { defineConfig, devices } from "@playwright/test";

const ci = Boolean(process.env.CI);
const shardCurrent = Number(process.env.DOCS_E2E_SHARD ?? "");
const shardTotal = Number(process.env.DOCS_E2E_SHARD_TOTAL ?? "");
/** CI and local default: chromium only; nightly sets firefox or webkit. */
const projectEnv = (process.env.DOCS_E2E_PROJECT ?? "chromium").trim();
const projectNames = projectEnv.split(/[\s,]+/).filter(Boolean);

const browserProjects = {
  chromium: { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  firefox: { name: "firefox", use: { ...devices["Desktop Firefox"] } },
  webkit: { name: "webkit", use: { ...devices["Desktop Safari"] } },
} as const;

const projects = projectNames.map((name) => {
  const project = browserProjects[name as keyof typeof browserProjects];
  if (!project) {
    throw new Error(`Unknown DOCS_E2E_PROJECT: ${name}`);
  }
  return project;
});

/** Static export is served on :3100 by CI and local `serve apps/docs/out`. */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: ci ? 2 : 1,
  retries: ci ? 1 : 0,
  reporter: "list",
  // pnpm extra-args were not reaching Playwright (`--shard` ran all 308 tests
  // on every matrix job). Shard via env instead.
  ...(Number.isInteger(shardCurrent) && shardCurrent > 0 && Number.isInteger(shardTotal) && shardTotal > 0
    ? { shard: { current: shardCurrent, total: shardTotal } }
    : {}),
  use: {
    baseURL: process.env.DOCS_E2E_BASE_URL ?? "http://127.0.0.1:3100",
    trace: ci ? "on-first-retry" : "off",
  },
  projects,
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    },
  },
});
