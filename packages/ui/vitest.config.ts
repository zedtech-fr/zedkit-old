import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    // Lets Testing Library auto-cleanup renders between tests.
    globals: true,
    include: ["tests/**/*.test.{ts,tsx}"],
    // Gallery/calendar/overlays RTL and the 45s Next compile share this
    // package. Parallel files starve the 5s default on a loaded runner.
    fileParallelism: false,
  },
});
