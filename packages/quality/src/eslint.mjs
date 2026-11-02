// Shareable UI lint preset: charter rule ids live in docs/frontend-charter.md;
// the messages below carry the explanation.
//
// What it enforces on every .tsx/.jsx file:
// - jsx-a11y recommended (labels, keyboard, focus, ARIA)
// - Tailwind class hygiene (order, no duplicates, no conflicts, no unknown)
// - Tokens only: no raw palette colors (bg-red-500), no arbitrary hex/rgb
//   colors, no raw px font sizes, no arbitrary px/rem in className
//   (w-[13px], gap-[0.75rem]), no raw focus ring widths (focus:ring-2)
//   — use the semantic theme tokens
// - No `style` attributes; no forwardRef (ref is a prop); no explicit `any`;
//   files ≤ 300 lines, functions ≤ 60; no raw try/catch (use a tryCatch wrapper)
//
// Consumer setup (no copy: install the package, pass your Tailwind entry):
//   `import { uiPreset } from "@zedtech/zedkit-quality"` then
//   `export default [...uiPreset({ entryPoint: "./app/globals.css" })]`.
import js from "@eslint/js";
import jsxA11y from "eslint-plugin-jsx-a11y";
import betterTailwindcss from "eslint-plugin-better-tailwindcss";
import tseslint, { plugin as tsPlugin } from "typescript-eslint";

const DEEP_RELATIVE_IMPORT = {
  group: ["../..", "../../*", "../../../*"],
  message: "Deep relative imports are banned. Use the `#*` subpath import for this package.",
};

const DEFAULT_TRY_CATCH_SOURCE = "@zedtech/zedkit-core";

/**
 * Flat config for Node/TS packages: `@eslint/js` + `typescript-eslint`
 * recommended, raw try/catch ban, deep relative import ban. Spread first;
 * add `ignores` and a `try-catch.ts` override in the consumer.
 *
 * @param {{ tryCatchSource?: string }} [options]
 * @returns {import("eslint").Linter.Config[]}
 */
export function nodePreset(options = {}) {
  const tryCatchSource =
    typeof options.tryCatchSource === "string" && options.tryCatchSource !== ""
      ? options.tryCatchSource
      : DEFAULT_TRY_CATCH_SOURCE;
  return [
    js.configs.recommended,
    ...tseslint.configs.recommended,
    {
      name: "zedkit/node-base",
      rules: {
        "no-restricted-syntax": [
          "error",
          {
            selector: "TryStatement",
            message: `try-catch: raw try/catch is banned. Use tryCatch/tryCatchAsync from ${tryCatchSource} so thrown values become Error with cause.`,
          },
        ],
        "no-restricted-imports": ["error", { patterns: [DEEP_RELATIVE_IMPORT] }],
      },
    },
  ];
}

const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|fuchsia|pink|rose";
const COLOR_UTILS =
  "bg|text|border|ring|ring-offset|divide|from|via|to|decoration|outline|accent|caret|fill|stroke|shadow|placeholder";

/**
 * UI lint preset for .tsx/.jsx files.
 *
 * @param {{ entryPoint: string }} options - Path to the repo's Tailwind CSS
 * entry, so the plugin knows the theme tokens. Required, no default: the
 * per-repo CSS path is the one thing that varies.
 * @returns {import("eslint").Linter.Config[]} Flat config blocks.
 */
export function uiPreset({ entryPoint }) {
  if (typeof entryPoint !== "string" || entryPoint === "") {
    throw new Error("uiPreset: `entryPoint` is required (path to your Tailwind CSS entry).");
  }
  return [
    {
      name: "zedkit/ui-a11y",
      files: ["**/*.tsx", "**/*.jsx"],
      ...jsxA11y.flatConfigs.recommended,
    },
    {
      name: "zedkit/ui-tailwind",
      files: ["**/*.tsx", "**/*.jsx"],
      plugins: { "better-tailwindcss": betterTailwindcss },
      settings: {
        "better-tailwindcss": {
          entryPoint,
        },
      },
      rules: {
        "better-tailwindcss/enforce-consistent-class-order": "error",
        "better-tailwindcss/no-duplicate-classes": "error",
        "better-tailwindcss/no-conflicting-classes": "error",
        "better-tailwindcss/no-unknown-classes": "error",
        "better-tailwindcss/no-restricted-classes": [
          "error",
          {
            restrict: [
              {
                pattern: `(^|:)(${COLOR_UTILS})-(${PALETTE}|white|black)(-|/|$)`,
                message:
                  "tokens-color: raw palette classes (bg-red-500) are banned. Use a semantic token (background, foreground, primary, destructive, …) so light and dark stay in sync.",
              },
              {
                pattern: "\\[(#|rgb|hsl)",
                message:
                  "tokens-color: arbitrary hex/rgb/hsl colors are banned. Use a semantic token (background, foreground, primary, …).",
              },
              {
                pattern: "text-\\[[^\\]]*px",
                message:
                  "tokens-style: raw px font sizes are banned. Use the type scale (text-xs … text-2xl).",
              },
              // Radix CSS variables (w-[var(--radix-popover-trigger-width)])
              // are not matched: they are not a px/rem literal. Overlays
              // must follow the trigger size. Hardcoded colours are already
              // tokens-color (palette + hex/rgb/hsl).
              {
                pattern: "\\[[0-9.]+(?:px|rem)\\]",
                message:
                  "tokens-arbitrary: raw px/rem in className (w-[13px], gap-[0.75rem]) are banned — use the spacing scale (w-4, gap-3) or the type scale (text-sm).",
              },
              // Decorative ring-1 / ring-0 stay. has-[:focus-visible]:ring-*
              // paints a parent when a child is focused; not a focus: variant.
              {
                pattern: "(^|:)(?:focus|focus-visible):(?:ring-offset-|ring-)[0-9]",
                message:
                  "tokens-focus: raw focus ring widths (focus:ring-2, focus-visible:ring-2) are banned — use focus-ring or focus-ring-control so --ring-width* apply.",
              },
            ],
          },
        ],
        // NOTE: flat-config rules replace (not merge) by key, so this block
        // restates the root TryStatement ban alongside the style-attribute
        // and forwardRef bans; without the restatement, .tsx files would lose them.
        "no-restricted-syntax": [
          "error",
          {
            selector: "TryStatement",
            message:
              "try-catch: raw try/catch is banned. Use tryCatch/tryCatchAsync from @zedtech/zedkit-core so thrown values become Error with cause.",
          },
          {
            selector: 'JSXAttribute[name.name="style"]',
            message:
              "tokens-style: inline style attributes are banned. Use theme tokens and utility classes.",
          },
          {
            selector: "Identifier[name='forwardRef']",
            message:
              "ui-ref: forwardRef is banned. Pass ref as a prop on ComponentProps<\"button\"> (see packages/ui/src/button.tsx).",
          },
        ],
      },
    },
    {
      name: "zedkit/ui-types",
      files: ["**/*.tsx", "**/*.jsx"],
      plugins: { "@typescript-eslint": tsPlugin },
      rules: {
        "@typescript-eslint/no-explicit-any": "error",
      },
    },
    {
      name: "zedkit/ui-size",
      files: ["**/*.tsx", "**/*.jsx"],
      ignores: ["**/*.test.*", "**/*.spec.*", "**/tests/**", "**/__tests__/**"],
      rules: {
        "max-lines": [
          "error",
          { max: 300, skipBlankLines: true, skipComments: true },
        ],
        "max-lines-per-function": [
          "error",
          { max: 60, skipBlankLines: true, skipComments: true, IIFEs: true },
        ],
      },
    },
  ];
}

// JS files the kit-scope block applies to (minus the view/data ignores).
const JS_FILES = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts", "**/*.js", "**/*.jsx", "**/*.mjs", "**/*.cjs"];
const JS_BRACE = "{ts,tsx,mts,cts,js,jsx,mjs,cjs}";

// Flat-config `files` never matches a bare directory (`app/ui/**` matches
// nothing): dir-style entries become `dir/**/*.{exts}`. Entries that
// already name files (`**/*.tsx`, braces) pass through untouched. A leaf
// containing a dot counts as a file pattern, so a directory whose own
// name has a dot must use a trailing `/**` to be treated as a folder.
function asFiles(patterns) {
  return patterns.map((entry) => {
    const leaf = entry.slice(entry.lastIndexOf("/") + 1);
    if (entry.endsWith("}") || leaf.includes(".")) return entry;
    const stripped = entry.endsWith("/**") ? entry.slice(0, -3) : entry;
    const dir = stripped.endsWith("/") ? stripped.slice(0, -1) : stripped;
    return `${dir}/**/*.${JS_BRACE}`;
  });
}

function assertExtraPatterns(extraPatterns, keys) {
  const want = keys.join(", ").replace(/, ([^,]+)$/, " or $1");
  for (const [key, value] of Object.entries(extraPatterns)) {
    if (!keys.includes(key)) {
      throw new Error(`defineLayers: unknown extraPatterns key "${key}" (want ${want})`);
    }
    if (!Array.isArray(value)) {
      throw new Error(`defineLayers: extraPatterns.${key} must be a list of no-restricted-imports pattern objects`);
    }
  }
}

/**
 * Route/view/data layer boundaries as `no-restricted-imports` blocks.
 * Dependencies run one way (routes -> views -> data):
 * - the UI kit is only imported from view files;
 * - views receive data as props and never import data clients or actions;
 * - data files import no UI (no React runtime, no UI kit).
 *
 * @param {object} options
 * - Classic: `{ kitPackage, viewDirs, dataDirs, actionPatterns, extraPatterns? }`.
 *   `actionPatterns` may be empty (views legitimately import data): the
 *   view ban is then omitted, and the view block is dropped when it
 *   would carry no bans at all. `extraPatterns` merges consumer bans
 *   into each block (keys: `kitScope`, `viewData`, `dataUi`).
 * - Preset `feature-folders`: `{ preset: "feature-folders", kitPackage,
 *   featureRoot, extraPatterns? }`. UI may import ports, not adapters;
 *   adapters are injected at the feature composition root; model is
 *   pure. Bans apply only under `featureRoot` (extraPatterns also
 *   accepts `model`).
 * @returns {import("eslint").Linter.Config[]} Flat config blocks.
 */
export function defineLayers(options) {
  const { preset, extraPatterns = {} } = options;
  if (preset === "feature-folders") {
    return featureFolderLayers(options);
  }
  if (preset !== undefined) {
    throw new Error(`defineLayers: unknown preset "${preset}" (want feature-folders)`);
  }
  const { kitPackage, viewDirs, dataDirs, actionPatterns } = options;
  assertExtraPatterns(extraPatterns, ["kitScope", "viewData", "dataUi"]);
  if (!Array.isArray(actionPatterns)) {
    throw new Error("defineLayers: actionPatterns must be a list of import specifiers (may be empty)");
  }
  const kitPatterns = [kitPackage, `${kitPackage}/*`];
  const views = asFiles(viewDirs);
  const data = asFiles(dataDirs);
  const extras = { kitScope: [], viewData: [], dataUi: [], ...extraPatterns };
  // An empty group fails ESLint schema validation, so an empty
  // actionPatterns omits the ban; with no viewData extras either,
  // the whole block is dropped (a ban-less block is noise).
  const viewDataPatterns = [
    ...(actionPatterns.length > 0
      ? [
          {
            group: [...actionPatterns],
            message: "Views receive data as props and never import data clients or server actions.",
          },
        ]
      : []),
    ...extras.viewData,
  ];
  return [
    {
      name: "zedkit/layers-kit-scope",
      files: JS_FILES,
      ignores: [...views, ...data],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: kitPatterns,
                message: "UI kit imports are only allowed from view files. Move this import into a view.",
              },
              ...extras.kitScope,
            ],
          },
        ],
      },
    },
    ...(viewDataPatterns.length > 0
      ? [
          {
            name: "zedkit/layers-view-data",
            files: views,
            rules: {
              "no-restricted-imports": ["error", { patterns: viewDataPatterns }],
            },
          },
        ]
      : []),
    {
      name: "zedkit/layers-data-ui",
      files: data,
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ["react", "react-dom", "react-dom/*", "react/jsx-runtime"],
                message: "Data code is UI-free: no React runtime imports.",
              },
              {
                group: kitPatterns,
                message: "Data code is UI-free: no UI kit imports.",
              },
              ...extras.dataUi,
            ],
          },
        ],
      },
    },
  ];
}

const ADAPTER_GROUP = ["**/adapters", "**/adapters/**"];
const REACT_GROUP = ["react", "react-dom", "react-dom/*", "react/jsx-runtime"];

function featureFolderLayers({
  kitPackage,
  featureRoot,
  extraPatterns = {},
  viewDirs,
  dataDirs,
  actionPatterns,
}) {
  if (viewDirs !== undefined || dataDirs !== undefined || actionPatterns !== undefined) {
    throw new Error("defineLayers: preset feature-folders uses featureRoot, not viewDirs/dataDirs/actionPatterns");
  }
  if (typeof featureRoot !== "string" || featureRoot === "") {
    throw new Error("defineLayers: featureRoot is required for preset feature-folders");
  }
  assertExtraPatterns(extraPatterns, ["kitScope", "viewData", "dataUi", "model"]);
  const root = featureRoot.replace(/\/$/, "");
  const kitPatterns = [kitPackage, `${kitPackage}/*`];
  const views = asFiles([`${root}/**/ui/**`]);
  const adapters = asFiles([`${root}/**/adapters/**`]);
  const model = asFiles([`${root}/**/model/**`]);
  const compose = [`${root}/*/index.ts`, `${root}/*/index.tsx`, `${root}/*/compose.ts`, `${root}/*/compose.tsx`];
  const extras = { kitScope: [], viewData: [], dataUi: [], model: [], ...extraPatterns };
  return [
    {
      name: "zedkit/layers-kit-scope",
      files: asFiles([root]),
      ignores: [...views, ...adapters, ...model, ...compose],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: kitPatterns,
                message:
                  "layers-features: UI kit imports are only allowed from view files. Move this import into a view.",
              },
              {
                group: REACT_GROUP,
                message: "layers-features: only ui/ and the composition root import React.",
              },
              {
                group: ADAPTER_GROUP,
                message:
                  "layers-features: inject adapters at the feature composition root (index.ts or compose.ts).",
              },
              ...extras.kitScope,
            ],
          },
        ],
      },
    },
    {
      name: "zedkit/layers-view-data",
      files: views,
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: ADAPTER_GROUP,
                message:
                  "layers-features: UI files import ports, not adapters. Inject the adapter at the feature composition root.",
              },
              ...extras.viewData,
            ],
          },
        ],
      },
    },
    {
      name: "zedkit/layers-data-ui",
      files: adapters,
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: REACT_GROUP,
                message: "layers-features: data code is UI-free: no React runtime imports.",
              },
              {
                group: kitPatterns,
                message: "layers-features: data code is UI-free: no UI kit imports.",
              },
              ...extras.dataUi,
            ],
          },
        ],
      },
    },
    {
      name: "zedkit/layers-model-pure",
      files: model,
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                group: REACT_GROUP,
                message: "layers-features: model is pure: no React runtime. Keep I/O in adapters.",
              },
              {
                group: kitPatterns,
                message: "layers-features: model is pure: no UI kit imports.",
              },
              {
                group: ADAPTER_GROUP,
                message: "layers-features: model is pure: adapters are injected at the composition root.",
              },
              ...extras.model,
            ],
          },
        ],
      },
    },
  ];
}
