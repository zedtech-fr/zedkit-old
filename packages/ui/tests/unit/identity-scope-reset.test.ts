import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/*
 * A scoped mist subtree (`data-identity-scope` + `data-identity="mist"`)
 * sits under a page identity and must not inherit its tokens. The reset
 * block in identities.css re-declares every token an identity overrides,
 * with the stock value. These checks keep that block in step with the
 * identity files and with the stock blocks it copies.
 */
const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
const identitiesCss = readFileSync(join(src, "identities.css"), "utf8");
const identityFiles = readdirSync(join(src, "identities")).filter((file: string) => file.endsWith(".css"));

/** Declarations (`--name: value`) in a block body. */
function declarations(body: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const match of body.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(match[1]!, match[2]!.replace(/\s+/g, " ").trim());
  }
  return out;
}

/** Body of the first block whose selector list is exactly `selector`, after `from`. */
function block(css: string, selector: string, from = 0): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(^|\\}\\s*|\\*/\\s*)${escaped}\\s*\\{([^}]*)\\}`, "m").exec(css.slice(from));
  if (!match) throw new Error(`block ${selector} not found`);
  return match[2]!;
}

const resetStart = identitiesCss.indexOf("Scoped mist resets the stock tokens.");
const MIST = '[data-identity-scope][data-identity="mist"]';
const resetLight = declarations(block(identitiesCss, MIST, resetStart));
const resetDark = declarations(block(identitiesCss, `${MIST}.dark`, resetStart));

/** Tokens the reset leaves to someone else: the mist family block, and glass.css for glass tokens. */
const handledElsewhere = (name: string): boolean =>
  name === "--zk-font-sans" || name === "--zk-font-display" || (name.startsWith("--zk-glass-") && name !== "--zk-glass-highlight");

describe("scoped mist resets the stock tokens", () => {
  it("finds the reset blocks", () => {
    expect(resetStart).toBeGreaterThan(0);
    expect(resetLight.size).toBeGreaterThan(50);
    expect(resetDark.size).toBeGreaterThan(20);
  });

  it("applies scoped dark tokens on the scope node, not an ancestor .dark", () => {
    expect(identitiesCss).toContain(`${MIST}.dark`);
    expect(identitiesCss).not.toContain(`.dark ${MIST}`);
    for (const file of identityFiles) {
      const css = read(join("identities", file));
      expect(css).not.toMatch(/\.dark\s+\[data-identity-scope\]/);
      expect(css).toMatch(/\[data-identity-scope\]\[data-identity="[a-z]+"\]\.dark/);
    }
  });

  it.each(identityFiles)("re-declares every token %s overrides", (file: string) => {
    const missing = [...declarations(read(join("identities", file))).keys()].filter(
      (name) => !handledElsewhere(name) && !resetLight.has(name),
    );
    expect(missing).toEqual([]);
  });

  it("copies the stock colours, light and dark, from styles.css", () => {
    const styles = read("styles.css");
    const light = declarations(block(styles, ":root"));
    const dark = declarations(block(styles, ".dark"));
    for (const [name, value] of resetLight) {
      if (light.has(name)) expect([name, value]).toEqual([name, light.get(name)]);
    }
    for (const [name, value] of dark) {
      expect([name, resetDark.get(name)]).toEqual([name, value]);
    }
  });

  it("copies the stock depth and motion tokens from identities.css and styles.css", () => {
    const stock = new Map([
      ...declarations(block(read("identities.css"), ":root")),
      ...declarations(read("styles.css").match(/Motion tokens[\s\S]*?:root\s*\{([^}]*)\}/)?.[1] ?? ""),
    ]);
    const stockDark = declarations(block(read("identities.css"), ".dark"));
    for (const [name, value] of resetLight) {
      if (stock.has(name)) expect([name, value]).toEqual([name, stock.get(name)]);
    }
    for (const [name, value] of stockDark) {
      expect([name, resetDark.get(name)]).toEqual([name, value]);
    }
  });
});
