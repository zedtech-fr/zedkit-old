import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { logoAsset, logoSvg, type LogoTheme, type LogoVariant } from "#index.js";

const ASSETS = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

/** Every shipped file and the exact bytes it must hold. Refresh with `UPDATE_ASSETS=1 pnpm test`. */
function expectedAssets(): Map<string, string> {
  const files = new Map<string, string>();
  const variants: LogoVariant[] = ["mark", "wordmark", "lockup"];
  const themes: Exclude<LogoTheme, "current" | "auto">[] = ["on-light", "on-dark"];
  for (const variant of variants) {
    for (const theme of themes) {
      files.set(`${variant}-${theme}.svg`, `${logoSvg({ variant, theme })}\n`);
    }
  }
  files.set("favicon.svg", `${logoAsset("favicon").svg}\n`);
  files.set("apple-touch.svg", `${logoAsset("apple-touch").svg}\n`);
  files.set("og.svg", `${logoAsset("og").svg}\n`);
  return files;
}

describe("assets/", () => {
  const expected = expectedAssets();

  if (process.env.UPDATE_ASSETS) {
    mkdirSync(ASSETS, { recursive: true });
    for (const [name, svg] of expected) writeFileSync(join(ASSETS, name), svg);
  }

  it("ships exactly the generated files", () => {
    const shipped = existsSync(ASSETS) ? readdirSync(ASSETS).sort() : [];
    expect(shipped).toEqual([...expected.keys()].sort());
  });

  it.each([...expected])("%s matches the generator", (name, svg) => {
    expect(readFileSync(join(ASSETS, name), "utf8")).toBe(svg);
  });
});
