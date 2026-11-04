import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = resolve(__dirname, "../..");

const css = readFileSync(resolve(pkg, "src/surface.css"), "utf8");
const entry = readFileSync(resolve(pkg, "src/styles.css"), "utf8");

describe("glass surface", () => {
  it("is imported by the kit stylesheet", () => {
    expect(entry).toContain('@import "./surface.css";');
  });

  it("renders a solid popover panel without glass tokens", () => {
    expect(css).toMatch(/\[data-surface="glass"\]\s*{[^}]*background-color:\s*hsl\(var\(--popover\)\);/s);
    expect(css).toMatch(/\[data-surface="glass"\]\s*{[^}]*color:\s*hsl\(var\(--popover-foreground\)\);/s);
  });

  it("frosts with the overlay tokens under the glass identity", () => {
    expect(css).toMatch(/background-color:\s*hsl\(var\(--popover\) \/ var\(--zk-glass-overlay-alpha\)\)/);
    expect(css).toMatch(/background-image:\s*var\(--zk-glass-overlay-tint\)/);
    expect(css).toMatch(/backdrop-filter:\s*var\(--zk-glass-overlay-filter\)/);
    expect(css).toMatch(/border-color:\s*hsl\(var\(--zk-glass-edge\) \/ var\(--zk-glass-edge-alpha\)\)/);
    expect(css).toMatch(/box-shadow:\s*var\(--zk-shadow-overlay\)/);
  });

  it("falls back to a near-solid panel without backdrop-filter", () => {
    expect(css).toMatch(
      /@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)[\s\S]*background-color:\s*hsl\(var\(--popover\) \/ 0\.98\)/,
    );
  });

  it("renders opaque under forced colors", () => {
    expect(css).toMatch(/@media \(forced-colors: active\)[\s\S]*\[data-surface="glass"\][\s\S]*background-image:\s*none/);
  });
});
