import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    // Install, validate and prettier tests take 4 to 8 s on a shared CI runner
    // (under 1 s on a laptop); the 5 s default fails them without an assertion failing.
    testTimeout: 20_000,
  },
});
