import assert from "node:assert/strict";
import test from "node:test";
import { catalogPageKeys, expandFencePreviews, expandGuideSnippets } from "./generate.mjs";
import { checkGeneratedPage, readFrontmatterDescription, readFrontmatterTitle } from "./page-checks.mjs";
import { componentPageSections } from "../lib/component-page-sections.mjs";
import { declarationOrigin } from "../lib/declared-props.mjs";
import { partitionPropsEntries } from "../lib/props-priority.mjs";
import { groupCatalogResults } from "../lib/catalog-result-groups.mjs";

const page = `---
title: "Trigger actions with buttons"
description: "A button starts an action."
status: beta
---

## At a glance

- **Who:** Teams shipping actions
- **What:** A labeled button
- **Use when:** The user starts something
- **Avoid when:** The target is a link

<Tabs groupId="package-manager" persist items={["pnpm", "npm", "yarn"]}>
  <Tab value="pnpm">pnpm add @zedtech/zedkit-ui</Tab>
</Tabs>

\`\`\`tsx title="Usage"
<Button>Save</Button>
\`\`\`
`;

test("groupCatalogResults uses the same area labels as catalog filters", () => {
  const groups = groupCatalogResults([
    { area: "ui", package: "ui", href: "/docs/ui/a", title: "Button", need: "n", status: "stable" },
    { area: "backend", package: "core", href: "/docs/core/a", title: "tryCatch", need: "n", status: "stable" },
    { area: "backend", package: "quality", href: "/docs/quality/a", title: "lint", need: "n", status: "stable" },
    { area: "agents", package: "ai", href: "/docs/ai/a", title: "setup-ai", need: "n", status: "stable" },
  ]);
  assert.deepEqual(
    groups.map((group) => [group.id, group.label, group.entries.length]),
    [
      ["ui", "UI", 1],
      ["backend", "Core & server", 2],
      ["agents", "Agents", 1],
    ],
  );
});

test("partitionPropsEntries surfaces variant and size before inherited attrs", () => {
  const entries = [
    { name: "disabled" },
    { name: "variant" },
    { name: "size" },
    { name: "asChild" },
    { name: "type" },
  ];
  const { primary, inherited } = partitionPropsEntries(entries);
  assert.deepEqual(
    primary.map((entry) => entry.name),
    ["variant", "size", "asChild"],
  );
  assert.deepEqual(
    inherited.map((entry) => entry.name),
    ["disabled", "type"],
  );
});

test("partitionPropsEntries keeps required and kit-declared props, folds inherited ones", () => {
  const entries = [
    { name: "title", origin: "inherited" },
    { name: "label", required: true, origin: "inherited" },
    { name: "tone", origin: "kit" },
    { name: "onClick", origin: "inherited" },
    { name: "size", origin: "inherited" },
  ];
  const { primary, inherited } = partitionPropsEntries(entries, ["size"]);
  assert.deepEqual(primary.map((e) => e.name), ["label", "size", "tone"]);
  assert.deepEqual(inherited.map((e) => e.name), ["onClick", "title"]);
});

test("partitionPropsEntries in only-mode folds everything but the priority list", () => {
  const entries = [
    { name: "required", required: true, origin: "kit" },
    { name: "variant", origin: "kit" },
    { name: "other", origin: "kit" },
  ];
  const { primary, inherited } = partitionPropsEntries(entries, ["variant"], true);
  assert.deepEqual(primary.map((e) => e.name), ["variant"]);
  assert.deepEqual(inherited.map((e) => e.name), ["other", "required"]);
});

test("declarationOrigin follows where a property is declared", () => {
  const react = "/repo/node_modules/.pnpm/@types+react@19/node_modules/@types/react/index.d.ts";
  const lib = "/repo/node_modules/typescript/lib/lib.dom.d.ts";
  const kit = "/repo/packages/ui/src/layout.tsx";
  assert.equal(declarationOrigin([react]), "inherited");
  assert.equal(declarationOrigin([lib]), "inherited");
  assert.equal(
    declarationOrigin(["/repo/node_modules/.pnpm/react-hook-form@7/node_modules/react-hook-form/dist/types/controller.d.ts"]),
    "kit",
    "a wrapped library's own option is the component's API, not an element attribute",
  );
  assert.equal(declarationOrigin([kit]), "kit");
  assert.equal(declarationOrigin([react, kit]), "kit", "a kit redeclaration of a native name is the kit's option");
  assert.equal(declarationOrigin([]), "inherited");
});

test("componentPageSections lists a section only when it has content", () => {
  const always = ["example", "guidance", "install-or-copy", "usage-and-states"];
  assert.deepEqual(componentPageSections({ hasProps: false, a11y: "", related: [], troubleshooting: "" }), always);
  assert.deepEqual(
    componentPageSections({ hasProps: true, a11y: "Name it.", related: [{ title: "x" }], troubleshooting: "Wire the CSS." }),
    [...always, "props", "accessibility", "related", "troubleshooting"],
  );
  assert.deepEqual(componentPageSections({ hasProps: false, a11y: "Name it." }), [...always, "accessibility"]);
});

test("catalogPageKeys maps a need to folder/slug and suffixes collisions", () => {
  const keys = catalogPageKeys({
    packages: {
      "@zedtech/zedkit-ui": {
        needs: [{ need: "Trigger actions with buttons" }, { need: "Trigger actions with buttons" }],
      },
    },
  });
  assert.deepEqual(
    [...keys].sort(),
    ["ui/trigger-actions-with-buttons", "ui/trigger-actions-with-buttons-2"],
  );
});

test("expandFencePreviews inserts a live preview and optional import", () => {
  const source = '---\ntitle: "Demo"\n---\n\n```tsx preview="ButtonDemo"\n<Button />\n```\n';
  const out = expandFencePreviews(source, "../../components/component-preview");
  assert.match(out, /import \{ ComponentPreview \} from "\.\.\/\.\.\/components\/component-preview"/);
  assert.match(out, /<ComponentPreview demo="ButtonDemo"/);
  assert.match(out, /```tsx\n<Button \/>/);
  assert.equal(out.includes('preview="ButtonDemo"'), false);
});

test("expandGuideSnippets throws when the snippet file is missing", () => {
  assert.throws(() => expandGuideSnippets("{{snippet:does-not-exist.sh}}"), /guide snippet missing: does-not-exist\.sh/);
});

test("checkGeneratedPage accepts a full need page", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/trigger-actions-with-buttons.mdx",
    page,
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.deepEqual(errors, []);
  assert.equal(readFrontmatterDescription(page), "A button starts an action.");
  assert.equal(readFrontmatterTitle(page), "Trigger actions with buttons");
});

test("checkGeneratedPage fails when catalog accessibility is not rendered", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/trigger-actions-with-buttons.mdx",
    page,
    {
      seoMax: 160,
      descriptionsSeen: new Map(),
      a11yByTitle: new Map([["Trigger actions with buttons", "Native button semantics."]]),
    },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks the catalog Accessibility section")),
    true,
  );
});

test("checkGeneratedPage fails when a component page lacks the guidance block", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/confirm-destructive-actions.mdx",
    "---\ntitle: \"ConfirmDialog\"\ndescription: \"A destructive confirmation.\"\nstatus: beta\n---\n\n<ComponentPage registry={\"confirm-dialog\"} />\n",
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks ComponentPage guidance prop")),
    true,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks install tabs")),
    false,
  );
});

test("checkGeneratedPage fails when install tabs or description are missing", () => {
  const errors = [];
  checkGeneratedPage(
    "ui/broken.mdx",
    "---\ntitle: \"Broken\"\n---\n\n## At a glance\n",
    { seoMax: 160, descriptionsSeen: new Map() },
    errors,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks description frontmatter")),
    true,
  );
  assert.equal(
    errors.some((entry) => entry.includes("lacks install tabs")),
    true,
  );
});

test("checkGeneratedPage reports a duplicate description", () => {
  const seen = new Map();
  const errors = [];
  checkGeneratedPage("ui/a.mdx", page, { seoMax: 160, descriptionsSeen: seen }, errors);
  checkGeneratedPage("ui/b.mdx", page, { seoMax: 160, descriptionsSeen: seen }, errors);
  assert.equal(
    errors.some((entry) => entry.includes("duplicate description on ui/b.mdx and ui/a.mdx")),
    true,
  );
});
