import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "src");
const read = (file: string): string => readFileSync(join(src, file), "utf8");
const stripComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");

const NEW_TOKENS = [
  "--zk-motion-intensity",
  "--zk-parallax-amplitude",
  "--zk-parallax-amplitude-x",
  "--zk-parallax-max-shift",
  "--zk-motion-mobile",
  "--zk-pin-top",
] as const;

describe("motion tokens", () => {
  const tokensCss = read("motion-tokens.css");
  const tokensBody = stripComments(tokensCss);

  it("is imported after motion.css so keyframe overrides win", () => {
    const styles = read("styles.css");
    const motion = styles.indexOf('@import "./motion.css"');
    const tokens = styles.indexOf('@import "./motion-tokens.css"');
    expect(motion).toBeGreaterThan(-1);
    expect(tokens).toBeGreaterThan(motion);
  });

  it("reads every knob as var(--zk-…, fallback), not as identity stock", () => {
    expect(tokensBody).toContain("var(--zk-motion-intensity, 1)");
    expect(tokensBody).toContain("var(--zk-motion-mobile, 1)");
    expect(tokensCss).toContain(
      "min(calc(var(--zk-reveal-distance, 0.75rem) * 8), var(--zk-parallax-max-shift, 120px))",
    );
    expect(tokensCss).toContain(
      "min(calc(var(--zk-reveal-distance, 0.75rem) * 8), var(--zk-parallax-max-shift, 12vw))",
    );
    expect(tokensCss).toContain("var(--zk-pin-top, calc(var(--zk-header-height, 3.5rem) + 1rem))");
  });

  it("halves motion on viewports under 40rem without a stock :root intensity", () => {
    expect(tokensBody).toMatch(/@media\s*\(max-width:\s*40rem\)\s*\{\s*:root\s*\{[^}]*--zk-motion-mobile:\s*0\.5/);
    expect(tokensBody).not.toMatch(/:root\s*\{[^}]*--zk-motion-intensity\s*:/);
    expect(tokensBody).not.toMatch(/:root\s*\{[^}]*--zk-parallax-amplitude\s*:/);
    expect(tokensBody).not.toMatch(/:root\s*\{[^}]*--zk-pin-top\s*:/);
  });

  it("makes intensity 0 a zero parallax translate on the existing scroll alias", () => {
    const from = tokensBody.slice(tokensBody.indexOf("@keyframes zk-parallax"));
    expect(from).toMatch(
      /translate:\s*0\s+calc\(\s*var\(--zk-reveal-distance,\s*0\.75rem\)\s*\*\s*var\(--zk-motion-intensity,\s*1\)\s*\*\s*var\(--zk-motion-mobile,\s*1\)/,
    );
  });

  it("does not add identity tokens or a scoped-mist reset", () => {
    const identitiesCss = read("identities.css");
    for (const name of NEW_TOKENS) {
      expect(identitiesCss).not.toContain(name);
    }
    for (const file of readdirSync(join(src, "identities")).filter((entry) => entry.endsWith(".css"))) {
      expect(read(join("identities", file))).not.toMatch(new RegExp(NEW_TOKENS.join("|")));
    }
  });
});
