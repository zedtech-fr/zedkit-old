import { createMDX } from "fumadocs-mdx/next";

// Shared dev machines saturate when Next uses every core: cap build
// workers there (NEXT_BUILD_CPUS overrides anywhere). CI keeps the
// Next default. One build at a time: flock /tmp/zk-next-build.lock.
const buildCpus = Number(process.env.NEXT_BUILD_CPUS ?? (process.env.CI ? undefined : 2));

/** @type {import("next").NextConfig} */
const nextConfig = {
  // Static export: the docs build emits the whole site to apps/docs/out,
  // ready to be served by any static host.
  output: "export",
  // Playwright talks to 127.0.0.1; Next 16 otherwise blocks that origin in dev.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  experimental: {
    ...(Number.isFinite(buildCpus) && buildCpus > 0 ? { cpus: buildCpus } : {}),
    // Smaller client chunks on home/catalog (#618): barrel imports tree-shake per module.
    optimizePackageImports: [
      "@zedtech/zedkit-ui",
      "fumadocs-ui",
      "lucide-react",
      "class-variance-authority",
      "clsx",
      "tailwind-merge",
    ],
  },
};

const withMDX = createMDX();

export default withMDX(nextConfig);
