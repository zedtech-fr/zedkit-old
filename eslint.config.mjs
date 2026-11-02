import js from "@eslint/js";
import tseslint from "typescript-eslint";

import { defineLayers, uiPreset } from "@zedtech/zedkit-quality";

const deepRelativeImport = {
  group: ["../..", "../../*", "../../../*"],
  message: "Deep relative imports are banned. Use the `#*` subpath import for this package.",
};

// Files still over the uiPreset size budget. Drop a path when that file
// is under the cap. `max-lines` stays on for files that only miss the
// function cap, so they cannot grow past 300 unnoticed.
const sizeBudgetOverFile = [
  "apps/docs/components/project-tracker-demo-app.tsx",
  "packages/ui/preview/gallery.tsx",
];
// Phone preview chrome uses max-w-[390px]; there is no spacing token for
// that device width. This file turns the whole restrict rule off (palette
// and hex bans stay on every other tsx file).
const arbitraryValueBaseline = ["apps/docs/components/preview-viewport.tsx"];

const sizeBudgetOverFunction = [
  "apps/docs/components/admin-dashboard-demo-app.tsx",
  "apps/docs/components/component-page.tsx",
  "apps/docs/components/demos/drawer-demo.tsx",
  "apps/docs/components/demos/tabs-demo.tsx",
  "apps/docs/components/preview-viewport.tsx",
  "apps/docs/ui/catalog/catalog-view.tsx",
  "packages/ui/src/data-table.tsx",
  "packages/ui/src/identity-picker.tsx",
  "packages/ui/src/route-modal.tsx",
];

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Raw try/catch is banned everywhere: use tryCatch/tryCatchAsync from
      // @zedtech/zedkit-core so thrown values are normalized to Error with cause
      // preserved. Sole exception: the file that implements the wrappers.
      "no-restricted-syntax": [
        "error",
        {
          selector: "TryStatement",
          message:
            "try-catch: raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core so thrown values become Error with cause.",
        },
      ],
      // Deep relative imports are banned: use the package `#*` subpath
      // import (see "imports" in each package.json) instead of ../.. chains.
      "no-restricted-imports": ["error", { patterns: [deepRelativeImport] }],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["packages/core/src/try-catch.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  {
    // Root config and tooling scripts are plain Node: no DOM, Node
    // globals available.
    files: [
      "eslint.config.mjs",
      "apps/docs/next.config.mjs",
      "scripts/**/*.mjs",
      "apps/docs/scripts/*.mjs",
      "packages/ui/preview/*.mjs",
      "packages/ui/playwright.config.ts",
      "deploy/**/*.mjs",
    ],
    languageOptions: {
      globals: {
        console: "readonly",
        process: "readonly",
        URL: "readonly",
        Buffer: "readonly",
        fetch: "readonly",
        AbortSignal: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
      },
    },
  },
  // UI preset last: for .tsx/.jsx its no-restricted-syntax (try/catch +
  // style-attribute + forwardRef bans) intentionally wins over the root block above.
  // Dogfood: the repo consumes its own published preset (source-mapped
  // exports, so this resolves with zero build).
  ...uiPreset({
    entryPoint: new URL("./packages/ui/src/styles.css", import.meta.url).pathname,
  }),
  {
    files: sizeBudgetOverFile,
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
    },
  },
  {
    files: sizeBudgetOverFunction,
    rules: {
      "max-lines-per-function": "off",
    },
  },
  {
    files: arbitraryValueBaseline,
    rules: {
      "better-tailwindcss/no-restricted-classes": "off",
    },
  },
  {
    files: [
      "apps/docs/ui/home/home-hero-lead.tsx",
      "apps/docs/ui/catalog/catalog-view.tsx",
    ],
    rules: {
      "better-tailwindcss/no-unknown-classes": "off",
    },
  },
  ...defineLayers({
    preset: "feature-folders",
    kitPackage: "@zedtech/zedkit-ui",
    featureRoot: "apps/docs/features",
    extraPatterns: {
      kitScope: [deepRelativeImport],
      viewData: [deepRelativeImport],
      dataUi: [deepRelativeImport],
      model: [deepRelativeImport],
    },
  }),
  {
    // next/og ImageResponse requires inline styles; not user-facing UI.
    files: ["apps/docs/app/opengraph-image.tsx"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "TryStatement",
          message:
            "try-catch: raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core so thrown values become Error with cause.",
        },
      ],
    },
  },
  // Vendored third-party skills are verbatim upstream copies: never linted.
  // The ai kit ships them (and their helper scripts) as data, not as source.
  {
    ignores: [
      "**/.next/**",
      "**/out/**",
      "**/.source/**",
      "**/dist/**",
      "**/kit/**",
      "**/node_modules/**",
      "**/coverage/**",
      ".agents/**",
      ".claude/**",
      ".cursor/**",
    ],
  },
);
