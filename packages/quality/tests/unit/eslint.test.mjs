import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import { parser as tsParser, plugin as tsPlugin } from "typescript-eslint";
import { defineLayers, nodePreset, uiPreset } from "#index.mjs";

function restrictRow(prefix) {
  const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
  const restrict = tailwind.rules["better-tailwindcss/no-restricted-classes"][1].restrict;
  return restrict.find((row) => String(row.message).startsWith(prefix));
}

function arbitraryRow() {
  return restrictRow("tokens-arbitrary:");
}

function focusRow() {
  return restrictRow("tokens-focus:");
}

function matchesArbitrary(className) {
  return Boolean(className.match(arbitraryRow().pattern));
}

function matchesFocus(className) {
  return Boolean(className.match(focusRow().pattern));
}

describe("nodePreset", () => {
  it("includes recommended stacks and the try/catch and import-depth bans", () => {
    const blocks = nodePreset();
    const base = blocks.find((block) => block.name === "zedkit/node-base");
    expect(base).toBeDefined();
    const syntax = base.rules["no-restricted-syntax"][1];
    expect(syntax.message).toContain("@zedtech/zedkit-core");
    const patterns = base.rules["no-restricted-imports"][1].patterns;
    expect(patterns[0].group).toContain("../../*");
  });

  it("customizes the try/catch message import path", () => {
    const base = nodePreset({ tryCatchSource: "@acme/helpers" }).find((block) => block.name === "zedkit/node-base");
    expect(base.rules["no-restricted-syntax"][1].message).toContain("@acme/helpers");
  });

  it("flags raw try/catch when linted", () => {
    const linter = new Linter({ configType: "flat" });
    const config = [...nodePreset(), { files: ["**/*.ts"], languageOptions: { parser: tsParser } }];
    const messages = linter.verify("try { x(); } catch { /* noop */ }", config, { filename: "src/foo.ts" });
    expect(messages.some((m) => m.ruleId === "no-restricted-syntax")).toBe(true);
  });
});

describe("uiPreset", () => {
  it("carries the passed entryPoint into the tailwind settings", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    expect(tailwind.settings["better-tailwindcss"].entryPoint).toBe("/repo/app/globals.css");
  });

  it("fails fast when entryPoint is missing", () => {
    expect(() => uiPreset({})).toThrow("entryPoint");
  });

  it("lint messages carry the rule id and explanation", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    const restrict = tailwind.rules["better-tailwindcss/no-restricted-classes"][1].restrict;
    const messages = restrict.map((row) => row.message);
    const syntax = tailwind.rules["no-restricted-syntax"].filter((row) => typeof row === "object");
    const style = syntax.find((row) => String(row.selector).includes("style"));
    const tryCatch = syntax.find((row) => String(row.selector).includes("TryStatement"));
    const forwardRef = syntax.find((row) => String(row.selector).includes("forwardRef"));
    expect(messages[0]).toMatch(/^tokens-color: /);
    expect(messages[1]).toMatch(/^tokens-color: /);
    expect(messages[2]).toMatch(/^tokens-style: /);
    expect(messages[3]).toMatch(/^tokens-arbitrary: /);
    expect(messages[4]).toMatch(/^tokens-focus: /);
    expect(style.message).toMatch(/^tokens-style: /);
    expect(tryCatch.message).toMatch(/^try-catch: /);
    expect(forwardRef.message).toMatch(/^ui-ref: /);
    for (const message of [...messages, style.message, tryCatch.message, forwardRef.message]) {
      expect(message).not.toMatch(/frontend-charter/);
      expect(message.length).toBeGreaterThan(40);
    }
  });

  it("bans forwardRef and points at the button example", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    const syntax = tailwind.rules["no-restricted-syntax"];
    const linter = new Linter({ configType: "flat" });
    const config = { files: ["**/*.tsx"], rules: { "no-restricted-syntax": syntax } };
    const member = linter.verify(
      "const X = React.forwardRef((props, ref) => props);\n",
      config,
      "button.tsx",
    );
    expect(member).toHaveLength(1);
    expect(member[0].ruleId).toBe("no-restricted-syntax");
    expect(member[0].message).toContain("packages/ui/src/button.tsx");
    const named = linter.verify(
      "const X = forwardRef((props, ref) => props);\n",
      config,
      "button.tsx",
    );
    expect(named).toHaveLength(1);
    expect(named[0].message).toContain("ComponentProps");
    const imported = linter.verify(
      'import { forwardRef } from "react";\n',
      config,
      "button.tsx",
    );
    expect(imported.some((entry) => entry.message.includes("forwardRef"))).toBe(true);
  });

  it("bans inline style attributes", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    const syntax = tailwind.rules["no-restricted-syntax"];
    const linter = new Linter({ configType: "flat" });
    const hits = linter.verify(
      'export function X() { return <div style={{ color: "red" }} />; }\n',
      {
        files: ["**/*.tsx"],
        languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
        rules: { "no-restricted-syntax": syntax },
      },
      "box.tsx",
    );
    expect(hits.some((entry) => String(entry.message).includes("tokens-style"))).toBe(true);
  });

  it("caps tsx files at 300 lines and functions at 60", () => {
    const size = uiPreset({ entryPoint: "/repo/app/globals.css" }).find((block) => block.name === "zedkit/ui-size");
    expect(size.rules["max-lines"][1].max).toBe(300);
    expect(size.rules["max-lines-per-function"][1].max).toBe(60);
    const linter = new Linter({ configType: "flat" });
    const long = Array.from({ length: 320 }, (_, i) => `const n${i} = ${i};`).join("\n");
    const hits = linter.verify(long, { files: ["**/*.tsx"], rules: size.rules }, "wide.tsx");
    expect(hits.some((entry) => entry.ruleId === "max-lines")).toBe(true);
    const fat = `export function fat() {\n${Array.from({ length: 70 }, (_, i) => `  const n${i} = ${i};`).join("\n")}\n}\n`;
    const fnHits = linter.verify(fat, { files: ["**/*.tsx"], rules: size.rules }, "fat.tsx");
    expect(fnHits.some((entry) => entry.ruleId === "max-lines-per-function")).toBe(true);
  });

  it("flags arbitrary px in className and allows the spacing scale", () => {
    expect(matchesArbitrary("w-[13px]")).toBe(true);
    expect(matchesArbitrary("w-4")).toBe(false);
    expect(arbitraryRow().message).toMatch(/w-4|spacing scale/);
  });

  it("flags arbitrary rem in className and allows the spacing scale", () => {
    expect(matchesArbitrary("gap-[0.75rem]")).toBe(true);
    expect(matchesArbitrary("gap-3")).toBe(false);
    expect(arbitraryRow().message).toMatch(/gap-3|spacing scale/);
  });

  it("flags arbitrary px/rem inside cn() and cva() args", () => {
    const [, tailwind] = uiPreset({ entryPoint: "/repo/app/globals.css" });
    // Default callees already include cn and cva; we do not override them.
    expect(tailwind.settings["better-tailwindcss"].callees).toBeUndefined();
    expect(matchesArbitrary("w-[13px]")).toBe(true);
    expect(matchesArbitrary("gap-[0.75rem]")).toBe(true);
    expect(matchesArbitrary("w-4")).toBe(false);
    expect(matchesArbitrary("gap-3")).toBe(false);
  });

  it("allows Radix CSS variables in arbitrary class values", () => {
    expect(matchesArbitrary("w-[var(--radix-popover-trigger-width)]")).toBe(false);
    expect(matchesArbitrary("min-w-[var(--radix-select-trigger-width)]")).toBe(false);
    expect(matchesArbitrary("h-[var(--radix-select-trigger-height)]")).toBe(false);
  });

  it("flags raw focus ring widths and names focus-ring", () => {
    expect(matchesFocus("focus:ring-2")).toBe(true);
    expect(matchesFocus("focus-visible:ring-2")).toBe(true);
    expect(matchesFocus("focus-visible:ring-offset-2")).toBe(true);
    expect(matchesFocus("sm:focus-visible:ring-2")).toBe(true);
    expect(matchesFocus("focus-ring")).toBe(false);
    expect(matchesFocus("focus-ring-control")).toBe(false);
    expect(matchesFocus("ring-1")).toBe(false);
    expect(matchesFocus("ring-0")).toBe(false);
    expect(matchesFocus("focus-visible:ring-ring")).toBe(false);
    expect(matchesFocus("has-[:focus-visible]:ring-2")).toBe(false);
    expect(focusRow().message).toMatch(/focus-ring/);
  });

  it("bans explicit any and tells the reader to name a type", () => {
    const types = uiPreset({ entryPoint: "/repo/app/globals.css" }).find((block) => block.name === "zedkit/ui-types");
    expect(types.rules["@typescript-eslint/no-explicit-any"]).toBe("error");
    const linter = new Linter({ configType: "flat" });
    const hits = linter.verify(
      "const x: any = 1;\n",
      {
        files: ["**/*.tsx"],
        languageOptions: { parser: tsParser },
        plugins: { "@typescript-eslint": tsPlugin },
        rules: types.rules,
      },
      "row.tsx",
    );
    expect(hits.some((entry) => entry.ruleId === "@typescript-eslint/no-explicit-any")).toBe(true);
    expect(hits[0].message).toMatch(/Specify a different type/i);
  });
});

describe("defineLayers", () => {
  const layers = defineLayers({
    kitPackage: "@acme/ui",
    viewDirs: ["app/**/ui/**"],
    dataDirs: ["lib/**"],
    actionPatterns: ["@/lib/*", "**/actions", "**/actions/**"],
  });
  const linter = new Linter();
  const kitImport = 'import { Button } from "@acme/ui";\n';

  it("allows kit imports in viewDirs, denies them in app dirs", () => {
    expect(linter.verify(kitImport, layers, "app/ui/card-view.ts")).toEqual([]);
    const blocked = linter.verify(kitImport, layers, "app/page.ts");
    expect(blocked).toHaveLength(1);
    expect(blocked[0].ruleId).toBe("no-restricted-imports");
    expect(blocked[0].message).toContain("only allowed from view files");
  });

  it("denies data-client imports from views", () => {
    const blocked = linter.verify('import { getOrder } from "@/lib/orders";\n', layers, "app/ui/card-view.ts");
    expect(blocked).toHaveLength(1);
    expect(blocked[0].ruleId).toBe("no-restricted-imports");
    expect(blocked[0].message).toContain("never import data clients");
  });

  it("denies UI imports from data dirs, once, with the data message", () => {
    const blocked = linter.verify(kitImport, layers, "lib/db.ts");
    expect(blocked).toHaveLength(1);
    expect(blocked[0].message).toContain("UI-free");
    const react = linter.verify('import { useState } from "react";\n', layers, "lib/db.ts");
    expect(react).toHaveLength(1);
    expect(react[0].message).toContain("UI-free");
  });

  it("merges extraPatterns into each block without dropping the preset bans", () => {
    const withExtras = defineLayers({
      kitPackage: "@acme/ui",
      viewDirs: ["app/**/ui/**"],
      dataDirs: ["lib/**"],
      actionPatterns: ["@/lib/*"],
      extraPatterns: {
        kitScope: [{ group: ["payload"], message: "no payload core here" }],
        viewData: [{ group: ["node:fs"], message: "no fs in views" }],
        dataUi: [{ group: ["@acme/admin"], message: "no admin in data" }],
      },
    });
    // Extra + preset ban coexist in the kit-scope block.
    const payload = linter.verify('import x from "payload";\n', withExtras, "app/page.ts");
    expect(payload).toHaveLength(1);
    expect(payload[0].message).toContain("no payload core");
    const kit = linter.verify(kitImport, withExtras, "app/page.ts");
    expect(kit).toHaveLength(1);
    expect(kit[0].message).toContain("only allowed from view files");
    // Extras land in their own block only.
    expect(linter.verify('import x from "payload";\n', withExtras, "app/ui/card-view.ts")).toEqual([]);
    const fs = linter.verify('import x from "node:fs";\n', withExtras, "app/ui/card-view.ts");
    expect(fs).toHaveLength(1);
    expect(fs[0].message).toContain("no fs in views");
    const admin = linter.verify('import x from "@acme/admin";\n', withExtras, "lib/db.ts");
    expect(admin).toHaveLength(1);
    expect(admin[0].message).toContain("no admin in data");
  });

  it("fails fast on unknown extraPatterns keys", () => {
    expect(() =>
      defineLayers({
        kitPackage: "@acme/ui",
        viewDirs: ["app/**/ui/**"],
        dataDirs: ["lib/**"],
        actionPatterns: ["@/lib/*"],
        extraPatterns: { kitcope: [] },
      }),
    ).toThrow('unknown extraPatterns key "kitcope"');
  });

  it("fails fast on non-list extraPatterns values", () => {
    expect(() =>
      defineLayers({
        kitPackage: "@acme/ui",
        viewDirs: ["app/**/ui/**"],
        dataDirs: ["lib/**"],
        actionPatterns: ["@/lib/*"],
        extraPatterns: { kitScope: "payload" },
      }),
    ).toThrow("extraPatterns.kitScope must be a list");
  });

  it("drops the view ban (and the block) when actionPatterns is empty", () => {
    const layers = defineLayers({
      kitPackage: "@acme/ui",
      viewDirs: ["app/**/ui/**"],
      dataDirs: ["lib/**"],
      actionPatterns: [],
    });
    expect(layers.map((block) => block.name)).toEqual(["zedkit/layers-kit-scope", "zedkit/layers-data-ui"]);
    // The config validates (verify would throw on an empty group),
    // and data imports stay allowed where no ban covers them.
    expect(linter.verify('import { getOrder } from "@/lib/orders";\n', layers, "app/page.ts")).toEqual([]);
    // Other blocks still ban.
    const kit = linter.verify(kitImport, layers, "app/page.ts");
    expect(kit).toHaveLength(1);
  });

  it("keeps viewData extras when actionPatterns is empty", () => {
    const layers = defineLayers({
      kitPackage: "@acme/ui",
      viewDirs: ["app/**/ui/**"],
      dataDirs: ["lib/**"],
      actionPatterns: [],
      extraPatterns: { viewData: [{ group: ["node:fs"], message: "no fs in views" }] },
    });
    expect(layers.map((block) => block.name)).toContain("zedkit/layers-view-data");
    const fs = linter.verify('import x from "node:fs";\n', layers, "app/ui/card-view.ts");
    expect(fs).toHaveLength(1);
    expect(fs[0].message).toContain("no fs in views");
    expect(linter.verify('import { getOrder } from "@/lib/orders";\n', layers, "app/ui/card-view.ts")).toEqual([]);
  });

  it("fails fast on non-list actionPatterns", () => {
    expect(() =>
      defineLayers({
        kitPackage: "@acme/ui",
        viewDirs: ["app/**/ui/**"],
        dataDirs: ["lib/**"],
        actionPatterns: "@/lib/*",
      }),
    ).toThrow("actionPatterns must be a list");
  });

  describe("preset feature-folders", () => {
    const layers = defineLayers({
      preset: "feature-folders",
      kitPackage: "@acme/ui",
      featureRoot: "features",
    });
    const linter = new Linter();
    const kitImport = 'import { Button } from "@acme/ui";\n';
    const adapterImport = 'import { createFixture } from "../adapters/fixture";\n';
    const portImport = 'import { noteListPort } from "../ports/note-list-port";\n';
    const reactImport = 'import { useState } from "react";\n';

    it("allows kit imports in feature ui, denies them in ports", () => {
      expect(linter.verify(kitImport, layers, "features/inbox/ui/inbox-view.ts")).toEqual([]);
      const port = linter.verify(kitImport, layers, "features/inbox/ports/inbox-port.ts");
      expect(port).toHaveLength(1);
      expect(port[0].message).toContain("only allowed from view files");
    });

    it("does not restrict kit imports outside the feature root", () => {
      const result = linter.verify(kitImport, layers, "app/page.ts");
      expect(result.filter((msg) => msg.ruleId === "no-restricted-imports")).toEqual([]);
    });

    it("denies adapter imports from ui, allows port imports", () => {
      const blocked = linter.verify(adapterImport, layers, "features/inbox/ui/inbox-view.ts");
      expect(blocked).toHaveLength(1);
      expect(blocked[0].ruleId).toBe("no-restricted-imports");
      expect(blocked[0].message).toContain("layers-features:");
      expect(blocked[0].message).toContain("ports");
      expect(linter.verify(portImport, layers, "features/inbox/ui/inbox-view.ts")).toEqual([]);
    });

    it("allows the composition root to import adapters and kit", () => {
      const adapter = linter.verify(adapterImport, layers, "features/inbox/index.ts");
      expect(adapter.filter((msg) => msg.ruleId === "no-restricted-imports")).toEqual([]);
      const kit = linter.verify(kitImport, layers, "features/inbox/index.ts");
      expect(kit.filter((msg) => msg.ruleId === "no-restricted-imports")).toEqual([]);
    });

    it("denies adapter and react imports from ports", () => {
      const adapter = linter.verify(adapterImport, layers, "features/inbox/ports/inbox-port.ts");
      expect(adapter).toHaveLength(1);
      expect(adapter[0].message).toContain("composition root");
      const react = linter.verify(reactImport, layers, "features/inbox/ports/inbox-port.ts");
      expect(react).toHaveLength(1);
      expect(react[0].message).toContain("composition root");
    });

    it("merges extraPatterns into every feature-folders block", () => {
      const extra = [{ group: ["../..", "../../*"], message: "no deep relative" }];
      const withExtras = defineLayers({
        preset: "feature-folders",
        kitPackage: "@acme/ui",
        featureRoot: "features",
        extraPatterns: { kitScope: extra, viewData: extra, dataUi: extra, model: extra },
      });
      const deep = 'import x from "../../lib";\n';
      for (const file of [
        "features/inbox/ports/inbox-port.ts",
        "features/inbox/ui/inbox-view.ts",
        "features/inbox/adapters/fixture.ts",
        "features/inbox/model/inbox-reducer.ts",
      ]) {
        const blocked = linter.verify(deep, withExtras, file);
        expect(blocked, file).toHaveLength(1);
        expect(blocked[0].message).toContain("no deep relative");
      }
    });

    it("keeps model pure: no react, kit, or adapters", () => {
      const react = linter.verify(reactImport, layers, "features/inbox/model/inbox-reducer.ts");
      expect(react).toHaveLength(1);
      expect(react[0].message).toContain("pure");
      const kit = linter.verify(kitImport, layers, "features/inbox/model/inbox-reducer.ts");
      expect(kit).toHaveLength(1);
      expect(kit[0].message).toContain("pure");
      const adapter = linter.verify(adapterImport, layers, "features/inbox/model/inbox-reducer.ts");
      expect(adapter).toHaveLength(1);
      expect(adapter[0].message).toContain("pure");
    });

    it("keeps adapters UI-free", () => {
      const react = linter.verify(reactImport, layers, "features/inbox/adapters/fixture.ts");
      expect(react).toHaveLength(1);
      expect(react[0].message).toContain("UI-free");
      const kit = linter.verify(kitImport, layers, "features/inbox/adapters/fixture.ts");
      expect(kit).toHaveLength(1);
      expect(kit[0].message).toContain("UI-free");
    });

    it("fails fast on unknown preset, missing featureRoot, and mixed classic keys", () => {
      expect(() => defineLayers({ preset: "hexagonal", kitPackage: "@acme/ui", featureRoot: "features" })).toThrow(
        'unknown preset "hexagonal"',
      );
      expect(() => defineLayers({ preset: "feature-folders", kitPackage: "@acme/ui" })).toThrow("featureRoot");
      expect(() =>
        defineLayers({
          preset: "feature-folders",
          kitPackage: "@acme/ui",
          featureRoot: "features",
          viewDirs: ["app/**/ui/**"],
        }),
      ).toThrow("featureRoot");
    });
  });
});
