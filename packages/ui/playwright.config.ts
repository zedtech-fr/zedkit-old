import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./preview",
  testMatch: /(smoke|parallax)\.spec\.ts/,
  fullyParallel: false,
  reporter: "list",
  expect: {
    toHaveScreenshot: {
      animations: "disabled",
      maxDiffPixelRatio: 0.02,
    },
  },
  use: {
    baseURL: "http://127.0.0.1:4123",
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    // Rebuilds the gallery, then serves it; the server is reused for
    // local reruns but always fresh in CI.
    command: "pnpm preview",
    port: 4123,
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },
});
