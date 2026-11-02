import { expect, test } from "@playwright/test";

import { DOCS_SHIPPED_IDENTITIES } from "./a11y-helpers";
import { useIdentity } from "./identity-helpers";

/**
 * A dark section inside a local identity must resolve to that identity's dark
 * tokens, whatever identity the page root carries (root Tide → local Press →
 * dark section is the case that used to fall to Tide: equal-specificity
 * descendant rules, won by file order).
 *
 * Two shapes are checked against the same identity pinned dark on its own node:
 * - the node `<ThemeScope mode="dark">` renders inside a scope (identity carried
 *   on the node): every token, shadows included;
 * - a hand-written plain `.dark` descendant: the colour, shape and type tokens.
 *   Shadow tokens are derived (`var(--zk-shadow-color)`) and custom properties
 *   inherit their resolved value, so a plain descendant cannot re-derive them.
 */
const TOKENS = ["--background", "--foreground", "--primary", "--card", "--border", "--radius", "--zk-font-sans"];
const DERIVED = ["--zk-shadow-md", "--zk-shadow-lg"];

/**
 * Two scopes of different identities, then a hand-written `.dark` section: the nearest scope owns it,
 * whichever identity file the bundle happens to load last (Tide → Press → dark used to resolve to Tide).
 * The reference is the same inner identity pinned dark on its own node, outside any other scope.
 */
for (const siteMode of ["light", "dark"] as const) {
  test(`scope in scope (${siteMode} site): a plain dark section follows the nearest scope, not the outer one`, async ({ page }) => {
    await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
    await useIdentity(page, "tide", siteMode);
    const result = await page.evaluate(
      ({ tokens, ids }) => {
        const main = document.querySelector("main")!;
        const read = (node: Element) =>
          Object.fromEntries(
            tokens.map((name) => [name, getComputedStyle(node).getPropertyValue(name).replace(/\s+/g, " ").trim()]),
          );
        const scopeNode = (id: string, dark: boolean) => {
          const node = document.createElement("div");
          node.setAttribute("data-identity-scope", "");
          node.setAttribute("data-identity", id);
          if (dark) node.className = "dark";
          return node;
        };
        const mismatches: string[] = [];
        for (const outerId of ids) {
          for (const innerId of ids) {
            const outer = scopeNode(outerId, false);
            const inner = scopeNode(innerId, false);
            const plain = document.createElement("div");
            plain.className = "dark";
            inner.append(plain);
            outer.append(inner);
            const reference = scopeNode(innerId, true);
            main.append(outer, reference);
            const got = read(plain);
            const want = read(reference);
            for (const name of tokens) {
              if (got[name] !== want[name]) {
                mismatches.push(`${outerId} → ${innerId} → dark: ${name} is ${got[name]}, ${innerId} dark has ${want[name]}`);
              }
            }
            outer.remove();
            reference.remove();
          }
        }
        return mismatches;
      },
      { tokens: TOKENS, ids: [...DOCS_SHIPPED_IDENTITIES] },
    );
    expect(result).toEqual([]);
  });
}

for (const root of DOCS_SHIPPED_IDENTITIES) {
  for (const siteMode of ["light", "dark"] as const) {
    test(`root ${root} (${siteMode}): a dark section keeps the nearer identity`, async ({ page }) => {
      await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
      await useIdentity(page, root, siteMode);
      const result = await page.evaluate(
        ({ tokens, derived, ids }) => {
          const main = document.querySelector("main")!;
          const read = (node: Element, names: string[]) =>
            Object.fromEntries(names.map((name) => [name, getComputedStyle(node).getPropertyValue(name).replace(/\s+/g, " ").trim()]));
          const scopeNode = (id: string, dark: boolean) => {
            const node = document.createElement("div");
            node.setAttribute("data-identity-scope", "");
            node.setAttribute("data-identity", id);
            if (dark) node.className = "dark";
            return node;
          };
          const out: Record<string, { carried: object; carriedRef: object; plain: object; plainRef: object }> = {};
          for (const id of ids) {
            const outer = scopeNode(id, false);
            const carried = scopeNode(id, true);
            const plain = document.createElement("div");
            plain.className = "dark";
            outer.append(carried, plain);
            const reference = scopeNode(id, true);
            main.append(outer, reference);
            out[id] = {
              carried: read(carried, [...tokens, ...derived]),
              carriedRef: read(reference, [...tokens, ...derived]),
              plain: read(plain, tokens),
              plainRef: read(reference, tokens),
            };
            outer.remove();
            reference.remove();
          }
          return out;
        },
        { tokens: TOKENS, derived: DERIVED, ids: [...DOCS_SHIPPED_IDENTITIES] },
      );
      for (const id of DOCS_SHIPPED_IDENTITIES) {
        const entry = result[id]!;
        expect(entry.carried, `root ${root} → local ${id} → ThemeScope dark node`).toEqual(entry.carriedRef);
        expect(entry.plain, `root ${root} → local ${id} → plain .dark section`).toEqual(entry.plainRef);
      }
    });
  }
}

/**
 * A plain `.dark` descendant follows the nearest scope for one change of look between scopes. Looks
 * nested alternately (X in Y in X) are what `ThemeScope mode="dark"` is for: it carries the look on the
 * node itself, so it is exact at any depth. This pins that supported path.
 */
test("alternating scopes: a dark ThemeScope node is exact at any depth", async ({ page }) => {
  await page.goto("/docs/ui/trigger-actions-with-buttons", { waitUntil: "networkidle" });
  await useIdentity(page, "tide", "light");
  const mismatches = await page.evaluate(
    ({ tokens, ids }) => {
      const main = document.querySelector("main")!;
      const read = (node: Element) =>
        Object.fromEntries(tokens.map((name) => [name, getComputedStyle(node).getPropertyValue(name).replace(/\s+/g, " ").trim()]));
      const scopeNode = (id: string, dark: boolean) => {
        const node = document.createElement("div");
        node.setAttribute("data-identity-scope", "");
        node.setAttribute("data-identity", id);
        if (dark) node.className = "dark";
        return node;
      };
      const out: string[] = [];
      for (const x of ids) {
        for (const y of ids) {
          if (x === y) continue;
          const outer = scopeNode(x, false);
          const middle = scopeNode(y, false);
          const inner = scopeNode(x, false);
          const leaf = scopeNode(x, true);
          inner.append(leaf);
          middle.append(inner);
          outer.append(middle);
          const reference = scopeNode(x, true);
          main.append(outer, reference);
          const got = read(leaf);
          const want = read(reference);
          for (const name of tokens) if (got[name] !== want[name]) out.push(`${x} > ${y} > ${x} > dark: ${name}`);
          outer.remove();
          reference.remove();
        }
      }
      return out;
    },
    { tokens: TOKENS, ids: [...DOCS_SHIPPED_IDENTITIES] },
  );
  expect(mismatches).toEqual([]);
});
