import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const css = readFileSync(join(src, "identities", "glass.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

/** Every value a token takes in the file, in source order: light, dark, then the fallbacks. */
function values(name: string): string[] {
  return [...css.matchAll(new RegExp(`${name}\\s*:\\s*([^;]+);`, "g"))].map((match) =>
    (match[1] ?? "").replace(/\s+/g, " ").trim(),
  );
}

describe("the glass material", () => {
  it("lights the rim from the top left: a bright edge, a soft opposite edge and an inner glow, in both modes", () => {
    const [light, dark] = values("--zk-glass-highlight");
    for (const rim of [light, dark]) {
      expect(rim).toMatch(/^inset 1px 1px 0 [^,]+, inset -1px -1px 0 [^,]+, inset 0 0 16px /);
    }
    const strength = (rim: string | undefined) => Number(/inset 1px 1px 0 hsl\(0 0% 100% \/ ([\d.]+)\)/.exec(rim ?? "")?.[1]);
    expect(strength(light)).toBeGreaterThan(0.8);
    expect(strength(dark)).toBeGreaterThan(0.15);
    expect(strength(dark)).toBeLessThan(strength(light));
  });

  it("lifts the blurred backdrop with saturation and brightness on cards, bars and overlays", () => {
    for (const name of ["--zk-glass-filter", "--zk-glass-bar-filter", "--zk-glass-overlay-filter"]) {
      const [value] = values(name);
      expect(value, name).toMatch(/blur\(.+\) saturate\(.+\) brightness\(var\(--zk-glass-brightness\)\)/);
    }
  });

  it("has a slanted sheen in light and dark, and none in a scope of another look or without transparency", () => {
    const sheens = values("--zk-glass-sheen");
    // light, dark, solid scope, reduced transparency, reduced transparency (no backdrop-filter), dark fallback
    expect(sheens[0]).toMatch(/^linear-gradient\(135deg/);
    expect(sheens[1]).toMatch(/^linear-gradient\(135deg/);
    expect(sheens.slice(2).every((value) => value === "none")).toBe(true);
    expect(sheens.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps an alpha floor on cards so text never sits on bare backdrop", () => {
    const [light, dark] = values("--zk-glass-alpha").map(Number);
    expect(light).toBeGreaterThanOrEqual(0.5);
    expect(dark).toBeGreaterThanOrEqual(0.45);
  });

  it("leaves a card's own wash alone and fills only plain cards with the sheen", () => {
    expect(css).toMatch(/:not\(\[class\*="bg-linear"\], \[class\*="bg-gradient"\], \[class\*="bg-\[url"\]\)/);
  });

  it("keeps a colour field behind the glass: the three halos are saturated enough to show through", () => {
    for (const pattern of values("--zk-bg-pattern")) {
      const alphas = [...pattern.matchAll(/hsl\(\d+ \d+% \d+% \/ ([\d.]+)\)/g)].map((match) => Number(match[1]));
      expect(alphas).toHaveLength(3);
      expect(Math.min(...alphas)).toBeGreaterThanOrEqual(0.24);
    }
  });
});
