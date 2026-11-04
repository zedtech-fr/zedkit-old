import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const pkg = resolve(__dirname, "../..");

const css = readFileSync(resolve(pkg, "src/styles.css"), "utf8");
const identities = readFileSync(resolve(pkg, "src/identities.css"), "utf8");

/** Mist / stock `--spacing` (identities.css). */
const MIST_SPACING_REM = 0.25;

const TOKENS = {
  "--zk-gap-sm": { factor: 2, mistRem: 0.5 },
  "--zk-gap-md": { factor: 3, mistRem: 0.75 },
  "--zk-gap-lg": { factor: 4, mistRem: 1 },
  "--zk-icon-size": { factor: 4, mistRem: 1 },
  "--zk-control-height": { factor: 9, mistRem: 2.25 },
  "--zk-page-gutter": { factor: 6, mistRem: 1.5 },
  "--zk-section-sm": { factor: 8, mistRem: 2 },
  "--zk-section-md": { factor: 12, mistRem: 3 },
  "--zk-section-lg": { factor: 24, mistRem: 6 },
  "--zk-section-xl": { factor: 28, mistRem: 7 },
} as const;

describe("semantic spacing tokens (#798)", () => {
  it("keeps mist spacing at 0.25rem so the multipliers stay exact", () => {
    expect(identities).toMatch(/--spacing:\s*0\.25rem;/);
  });

  it("floors section rhythm on phones so dense identities cannot collapse bands", () => {
    expect(css).toMatch(/--zk-section-md:\s*max\(2rem,\s*calc\(var\(--spacing\)\s*\*\s*12\)\)/);
    expect(css).toMatch(/--spacing-card-stack:\s*0\.5rem;/);
  });

  it("derives each token from --spacing with the mist-matching factor", () => {
    for (const [name, { factor, mistRem }] of Object.entries(TOKENS)) {
      const pattern = new RegExp(`${name}:\\s*calc\\(var\\(--spacing\\)\\s*\\*\\s*${factor}\\)`);
      expect(css, name).toMatch(pattern);
      expect(MIST_SPACING_REM * factor).toBeCloseTo(mistRem, 10);
    }
  });

  it("leaves leftover rem aliases in place", () => {
    expect(css).toMatch(/--spacing-button-gap:\s*0\.5rem;/);
    expect(css).toMatch(/--spacing-icon-control:\s*1rem;/);
  });

  it("wires control height and block aliases to --spacing", () => {
    expect(css).toMatch(/--spacing-control-height:\s*max\(var\(--zk-tap-min, 0px\), calc\(var\(--spacing\) \* 9\)\)/);
    expect(css).toMatch(/--spacing-control-height-sm:\s*max\(var\(--zk-tap-min, 0px\), calc\(var\(--spacing\) \* 8\)\)/);
    expect(css).toMatch(/--spacing-control-height-lg:\s*max\(var\(--zk-tap-min, 0px\), calc\(var\(--spacing\) \* 10\)\)/);
    expect(css).toMatch(/--spacing-control-block:\s*var\(--spacing\)/);
    expect(css).toMatch(/--spacing-control-block-lg:\s*calc\(var\(--spacing\) \* 2\)/);
    expect(MIST_SPACING_REM * 8).toBe(2);
    expect(MIST_SPACING_REM * 9).toBe(2.25);
    expect(MIST_SPACING_REM * 10).toBe(2.5);
    expect(MIST_SPACING_REM * 2).toBe(0.5);
  });

  it("wires layout spacing utilities to the identity-derived tokens", () => {
    expect(css).toMatch(/--spacing-page-gutter:\s*var\(--zk-page-gutter\)/);
    expect(css).toMatch(/--spacing-section-sm:\s*var\(--zk-section-sm\)/);
    expect(css).toMatch(/--spacing-section-md:\s*var\(--zk-section-md\)/);
    expect(css).toMatch(/--spacing-section-lg:\s*var\(--zk-section-lg\)/);
    expect(css).toMatch(/--spacing-section-xl:\s*var\(--zk-section-xl\)/);
  });

  it("defines container widths as runtime tokens and theme aliases", () => {
    expect(css).toMatch(/--zk-container-narrow:\s*32rem;/);
    expect(css).toMatch(/--zk-container-reading:\s*42rem;/);
    expect(css).toMatch(/--zk-container-default:\s*64rem;/);
    expect(css).toMatch(/--zk-container-wide:\s*90rem;/);
    expect(css).toMatch(/--container-narrow:\s*var\(--zk-container-narrow\)/);
    expect(css).toMatch(/--container-reading:\s*var\(--zk-container-reading\)/);
    expect(css).toMatch(/--container-default:\s*var\(--zk-container-default\)/);
    expect(css).toMatch(/--container-wide:\s*var\(--zk-container-wide\)/);
  });
});
